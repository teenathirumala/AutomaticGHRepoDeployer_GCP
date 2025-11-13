const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { generateSlug } = require('random-word-slugs')
const { Server } = require('socket.io')
const Redis = require('ioredis')
const cors = require('cors')
const { CloudBuildClient } = require('@google-cloud/cloudbuild')

const app = express()

const PORT = process.env.PORT || 9000
const SOCKET_PORT = process.env.SOCKET_PORT || 9002
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
const REDIS_URL = process.env.REDIS_URL

if (!REDIS_URL) {
  console.warn(
    '[api-server] REDIS_URL is not set. Log streaming will be disabled until a Redis endpoint is configured.'
  )
}

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Trace-Id']
}))

app.use(express.json())

const subscriber = REDIS_URL ? new Redis(REDIS_URL) : null
const io = new Server({ cors: '*' })

io.on('connection', socket => {
  socket.on('subscribe', channel => {
    socket.join(channel)
    socket.emit('message', `Joined ${channel}`)
  })
})

io.listen(SOCKET_PORT, () => console.log(`Socket Server listening on ${SOCKET_PORT}`))

const cloudBuild = new CloudBuildClient()

function buildPayload({ gitURL, projectSlug, traceId }) {
  const projectId = process.env.GCP_PROJECT_ID
  const location = process.env.CLOUD_BUILD_LOCATION || 'global'
  const builderImage = process.env.BUILDER_IMAGE

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID must be set for Cloud Build invocation.')
  }

  if (!builderImage) {
    throw new Error('BUILDER_IMAGE must point to the container image that runs the build-server.')
  }

  const bucketName = process.env.GCS_BUCKET
  if (!bucketName) {
    throw new Error('GCS_BUCKET must be provided to publish build outputs.')
  }

  const redisUrlEnv = REDIS_URL ? [`REDIS_URL=${REDIS_URL}`] : []

  return {
    projectId,
    location,
    build: {
      timeout: { seconds: parseInt(process.env.BUILD_TIMEOUT_SECONDS || '900', 10) },
      queueTtl: { seconds: parseInt(process.env.BUILD_QUEUE_TTL_SECONDS || '600', 10) },
      options: {
        dynamicSubstitutions: true,
        logging: process.env.BUILD_LOGGING || 'CLOUD_LOGGING_ONLY'
      },
      logsBucket: process.env.BUILD_LOGS_BUCKET || undefined,
      steps: [
        {
          name: builderImage,
          env: [
            `GIT_REPOSITORY_URL=${gitURL}`,
            `PROJECT_ID=${projectSlug}`,
            `GCS_BUCKET=${bucketName}`,
            `TRACE_ID=${traceId}`,
            ...redisUrlEnv
          ],
          entrypoint: process.env.BUILDER_ENTRYPOINT || 'node',
          args: process.env.BUILDER_ARGS ? JSON.parse(process.env.BUILDER_ARGS) : ['script.js']
        }
      ]
    }
  }
}

app.post('/project', async (req, res) => {
  const { gitURL, slug } = req.body

  if (!gitURL) {
    return res.status(400).json({ status: 'error', message: 'gitURL is required' })
  }

  const projectSlug = slug || generateSlug()
  const traceId = req.headers['x-trace-id'] || uuidv4()

  try {
    console.log('[api-server] Queueing build', { projectSlug, traceId, gitURL })
    const payload = buildPayload({ gitURL, projectSlug, traceId })

    const [operation] = await cloudBuild.createBuild({
      projectId: payload.projectId,
      build: payload.build,
      location: payload.location
    })

    const buildName = operation.name

    return res.json({
      status: 'queued',
      data: {
        projectSlug,
        buildName,
        traceId,
        url: `${process.env.PREVIEW_URL_BASE || 'https://preview.example.com'}/${projectSlug}`
      }
    })
  } catch (error) {
    console.error('[api-server] Failed to queue build', error)
    return res.status(500).json({ status: 'error', message: error.message })
  }
})

async function initRedisSubscribe() {
  if (!subscriber) return

  console.log('[api-server] Subscribing to build logs...')
  await subscriber.psubscribe('logs:*')
  subscriber.on('pmessage', (pattern, channel, message) => {
    const parsed = (() => {
      try {
        return JSON.parse(message)
      } catch {
        return { log: message }
      }
    })()

    io.to(channel).emit('message', JSON.stringify(parsed))
  })
}

initRedisSubscribe()

app.listen(PORT, () => console.log(`API Server listening on ${PORT}`))