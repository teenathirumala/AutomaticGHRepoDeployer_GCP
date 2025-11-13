const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
const { v4: uuidv4 } = require('uuid')
const Redis = require('ioredis')
const { Storage } = require('@google-cloud/storage')

const PROJECT_ID = process.env.PROJECT_ID
const GIT_REPOSITORY_URL = process.env.GIT_REPOSITORY_URL
const GCS_BUCKET = process.env.GCS_BUCKET
const GCS_PREFIX = process.env.GCS_OUTPUT_PREFIX || '__outputs'
const TRACE_ID = process.env.TRACE_ID || uuidv4()
const REDIS_URL = process.env.REDIS_URL

if (!PROJECT_ID) throw new Error('PROJECT_ID env var is required.')
if (!GIT_REPOSITORY_URL) throw new Error('GIT_REPOSITORY_URL env var is required.')
if (!GCS_BUCKET) throw new Error('GCS_BUCKET env var is required.')

const publisher = REDIS_URL ? new Redis(REDIS_URL) : null
const storage = new Storage()

function logWithTrace(message, stage = 'build') {
  const payload = {
    traceId: TRACE_ID,
    stage,
    projectId: PROJECT_ID,
    log: message
  }

  console.log(`[${stage}]`, message)
  if (publisher) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify(payload))
  }
}

async function cloneRepository(outputPath) {
  logWithTrace(`Cloning repository ${GIT_REPOSITORY_URL}`, 'clone')

  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { recursive: true, force: true })
  }

  const cloneCommand = `git clone ${GIT_REPOSITORY_URL} ${outputPath}`
  const cloneProcess = exec(cloneCommand)

  cloneProcess.stdout.on('data', data => logWithTrace(data.toString(), 'clone'))
  cloneProcess.stderr.on('data', data => logWithTrace(`error: ${data.toString()}`, 'error'))

  return new Promise((resolve, reject) => {
    cloneProcess.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`git clone failed with exit code ${code}`))
      }
      logWithTrace('Repository cloned')
      resolve()
    })
  })
}

async function runBuild(outputPath) {
  logWithTrace('Build started...')

  const installAndBuildCommand = `cd ${outputPath} && npm install && npm run build`
  const processRef = exec(installAndBuildCommand)

  processRef.stdout.on('data', data => {
    logWithTrace(data.toString())
  })

  processRef.stderr.on('data', data => {
    logWithTrace(`error: ${data.toString()}`, 'error')
  })

  return new Promise((resolve, reject) => {
    processRef.on('close', code => {
      if (code !== 0) {
        logWithTrace(`Build failed with exit code ${code}`, 'error')
        return reject(new Error(`Build failed with exit code ${code}`))
      }

      logWithTrace('Build complete')
      resolve()
    })
  })
}

async function uploadArtifacts() {
  logWithTrace('Preparing to upload artifacts')
  const distFolderPath = path.join(__dirname, 'output', 'dist')

  if (!fs.existsSync(distFolderPath)) {
    throw new Error(`Distribution folder not found at ${distFolderPath}`)
  }

  const bucket = storage.bucket(GCS_BUCKET)
  const files = fs.readdirSync(distFolderPath, { recursive: true })

  for (const file of files) {
    const filePath = path.join(distFolderPath, file)

    if (fs.lstatSync(filePath).isDirectory()) continue

    const destination = `${GCS_PREFIX}/${PROJECT_ID}/${file}`
    logWithTrace(`Uploading ${file} to gs://${GCS_BUCKET}/${destination}`)

    await bucket.upload(filePath, {
      destination,
      metadata: {
        cacheControl: process.env.GCS_CACHE_CONTROL || 'public, max-age=60',
        contentType: mime.lookup(filePath) || 'application/octet-stream',
        metadata: {
          traceId: TRACE_ID,
          projectId: PROJECT_ID
        }
      },
      resumable: false
    })

    logWithTrace(`Uploaded ${file}`)
  }

  logWithTrace('Upload complete')
}

async function init() {
  try {
    const outputPath = path.join(__dirname, 'output')
    await cloneRepository(outputPath)
    await runBuild(outputPath)
    await uploadArtifacts()
  } catch (error) {
    logWithTrace(error.message, 'error')
    throw error
  } finally {
    if (publisher) {
      publisher.disconnect()
    }
  }
}

init()