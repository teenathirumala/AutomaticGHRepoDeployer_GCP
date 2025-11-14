const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
const { v4: uuidv4 } = require('uuid')
const Redis = require('ioredis')
const { BlobServiceClient } = require('@azure/storage-blob')
const { DefaultAzureCredential } = require('@azure/identity')

const PROJECT_ID = process.env.PROJECT_ID
const GIT_REPOSITORY_URL = process.env.GIT_REPOSITORY_URL
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME
const AZURE_BLOB_CONTAINER_NAME = process.env.AZURE_BLOB_CONTAINER_NAME || 'build-outputs'
const BLOB_PREFIX = process.env.AZURE_BLOB_PREFIX || '__outputs'
const TRACE_ID = process.env.TRACE_ID || uuidv4()
const REDIS_URL = process.env.REDIS_URL

if (!PROJECT_ID) throw new Error('PROJECT_ID env var is required.')
if (!GIT_REPOSITORY_URL) throw new Error('GIT_REPOSITORY_URL env var is required.')
if (!AZURE_STORAGE_ACCOUNT_NAME) throw new Error('AZURE_STORAGE_ACCOUNT_NAME env var is required.')

const publisher = REDIS_URL ? new Redis(REDIS_URL) : null

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

// Azure Blob Storage client
const accountUrl = `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`
const credential = new DefaultAzureCredential()
const blobServiceClient = new BlobServiceClient(accountUrl, credential)

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
      logWithTrace('Repository cloned', 'clone')
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

  const containerClient = blobServiceClient.getContainerClient(AZURE_BLOB_CONTAINER_NAME)
  
  // Ensure container exists
  await containerClient.createIfNotExists({
    access: 'blob' // Public read access
  })

  const files = fs.readdirSync(distFolderPath, { recursive: true })

  for (const file of files) {
    const filePath = path.join(distFolderPath, file)

    if (fs.lstatSync(filePath).isDirectory()) continue

    const blobName = `${BLOB_PREFIX}/${PROJECT_ID}/${file}`
    logWithTrace(`Uploading ${file} to ${blobName}`)

    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    const contentType = mime.lookup(filePath) || 'application/octet-stream'
    const metadata = {
      traceId: TRACE_ID,
      projectId: PROJECT_ID
    }

    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: process.env.AZURE_CACHE_CONTROL || 'public, max-age=60'
      },
      metadata
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
