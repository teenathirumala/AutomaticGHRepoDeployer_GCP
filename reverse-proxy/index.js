const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
const PORT = process.env.PORT || 8000

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME
const AZURE_BLOB_CONTAINER_NAME = process.env.AZURE_BLOB_CONTAINER_NAME || 'build-outputs'
const BLOB_PREFIX = process.env.AZURE_BLOB_PREFIX || '__outputs'

if (!AZURE_STORAGE_ACCOUNT_NAME) {
  throw new Error('AZURE_STORAGE_ACCOUNT_NAME env var must be set for the reverse proxy.')
}

// Azure Blob Storage base URL
const BASE_PATH = `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${AZURE_BLOB_CONTAINER_NAME}/${BLOB_PREFIX}`

const proxy = httpProxy.createProxy()

// Health check endpoint for Azure Container Apps
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'reverse-proxy' })
})

// Timing middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    console.log(`[Proxy] ${req.method} ${req.url} - ${Date.now() - start}ms`)
  })
  next()
})

function resolveTarget(hostname) {
  const [subdomain] = hostname.split('.')
  return `${BASE_PATH}/${subdomain}`
}

app.use((req, res) => {
  try {
    const target = resolveTarget(req.hostname)
    return proxy.web(req, res, { target, changeOrigin: true, secure: true })
  } catch (error) {
    console.error('[reverse-proxy] Failed to resolve target', error)
    res.status(500).send('Preview misconfigured')
  }
})

proxy.on('proxyReq', (proxyReq, req) => {
  if (req.url === '/') {
    proxyReq.path += 'index.html'
  }
})

app.listen(PORT, () => {
  console.log(`Reverse Proxy listening on ${PORT}`)
})
