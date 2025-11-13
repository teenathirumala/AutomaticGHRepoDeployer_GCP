const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
const PORT = process.env.PORT || 8000

const BASE_PATH = process.env.GCS_ASSET_BASE_URL || 'https://storage.googleapis.com'
const OUTPUT_PREFIX = process.env.GCS_OUTPUT_PREFIX || '__outputs'

const proxy = httpProxy.createProxy()

function resolveTarget(hostname) {
  const [subdomain] = hostname.split('.')
  const bucket = process.env.GCS_BUCKET

  if (!bucket) {
    throw new Error('GCS_BUCKET env var must be set for the reverse proxy.')
  }

  return `${BASE_PATH}/${bucket}/${OUTPUT_PREFIX}/${subdomain}`
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

app.listen(PORT, () => console.log(`Reverse Proxy listening on ${PORT}`))