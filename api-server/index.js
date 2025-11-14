console.time("startup_time_api");

const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { generateSlug } = require('random-word-slugs')
const { ContainerInstanceManagementClient } = require('@azure/arm-containerinstance')
const { DefaultAzureCredential } = require('@azure/identity')
const { Server } = require('socket.io')
const Redis = require('ioredis')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 9000
const SOCKET_PORT = process.env.SOCKET_PORT || 9002
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Trace-Id']
}))

app.use(express.json())

// Health check endpoint for Azure Container Apps
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-server' })
})

const REDIS_URL = process.env.REDIS_URL
if (!REDIS_URL) {
  console.warn('[api-server] REDIS_URL is not set. Log streaming will be disabled.')
}

const subscriber = REDIS_URL ? new Redis(REDIS_URL) : null
const io = new Server({ cors: '*' })

io.on('connection', socket => {
  socket.on('subscribe', channel => {
    const start = Date.now()
    socket.join(channel)
    socket.emit('message', `Joined ${channel}`)
    console.log(`[Socket] Subscribed to ${channel} in ${Date.now() - start}ms`)
  })
})

console.time("startup_time_socket")
io.listen(SOCKET_PORT, () => {
  console.timeEnd("startup_time_socket")
  console.log(`Socket Server listening on ${SOCKET_PORT}`)
})

// Azure Container Instances client
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID
const resourceGroup = process.env.AZURE_RESOURCE_GROUP
const containerGroupNamePrefix = process.env.AZURE_CONTAINER_GROUP_PREFIX || 'build-'

if (!subscriptionId || !resourceGroup) {
  console.error('[api-server] AZURE_SUBSCRIPTION_ID and AZURE_RESOURCE_GROUP must be set')
}

const credential = new DefaultAzureCredential()
const containerClient = subscriptionId && resourceGroup 
  ? new ContainerInstanceManagementClient(credential, subscriptionId)
  : null

// Timing middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    const duration = Date.now() - start
    console.log(`[API] ${req.method} ${req.url} - ${duration}ms`)
  })
  next()
})

app.post('/project', async (req, res) => {
  const { gitURL, slug } = req.body

  if (!gitURL) {
    return res.status(400).json({ status: 'error', message: 'gitURL is required' })
  }

  if (!containerClient) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Azure Container Instances client not configured' 
    })
  }

  const projectSlug = slug || generateSlug()
  const traceId = req.headers['x-trace-id'] || uuidv4()

  try {
    console.log('[api-server] Queueing build', { projectSlug, traceId, gitURL })

    const containerGroupName = `${containerGroupNamePrefix}${projectSlug}-${Date.now()}`
    const builderImage = process.env.BUILDER_IMAGE
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
    const blobContainerName = process.env.AZURE_BLOB_CONTAINER_NAME || 'build-outputs'

    if (!builderImage) {
      throw new Error('BUILDER_IMAGE must be set')
    }

    if (!storageAccountName) {
      throw new Error('AZURE_STORAGE_ACCOUNT_NAME must be set')
    }

    const containerGroup = {
      location: process.env.AZURE_LOCATION || 'eastus',
      containers: [
        {
          name: 'builder',
          image: builderImage,
          resources: {
            requests: {
              cpu: 1,
              memoryInGb: 2
            }
          },
          environmentVariables: [
            { name: 'GIT_REPOSITORY_URL', value: gitURL },
            { name: 'PROJECT_ID', value: projectSlug },
            { name: 'TRACE_ID', value: traceId },
            { name: 'AZURE_STORAGE_ACCOUNT_NAME', value: storageAccountName },
            { name: 'AZURE_BLOB_CONTAINER_NAME', value: blobContainerName },
            ...(REDIS_URL ? [{ name: 'REDIS_URL', value: REDIS_URL }] : [])
          ]
        }
      ],
      osType: 'Linux',
      restartPolicy: 'Never'
    }

    await containerClient.containerGroups.beginCreateOrUpdateAndWait(
      resourceGroup,
      containerGroupName,
      containerGroup
    )

    return res.json({
      status: 'queued',
      data: {
        projectSlug,
        containerGroupName,
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

app.listen(PORT, () => {
  console.timeEnd("startup_time_api")
  console.log(`API Server listening on ${PORT}`)
})
