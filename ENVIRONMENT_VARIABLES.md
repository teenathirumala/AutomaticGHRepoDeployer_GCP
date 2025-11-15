# Environment Variables

This document lists all required and optional environment variables for GCP implementation.

##  GCP Version (`gcp` branch)

### API Server (`api-server/`)

**Required:**
- `GCP_PROJECT_ID` - GCP project ID
- `BUILDER_IMAGE` - Container image for build server (e.g., `us-central1-docker.pkg.dev/PROJECT/repo/builder:latest`)
- `GCS_BUCKET` - Cloud Storage bucket name
- `REDIS_URL` - Redis connection string (optional, for log streaming)

**Optional:**
- `PORT` - API server port (default: `9000`)
- `SOCKET_PORT` - WebSocket server port (default: `9002`)
- `FRONTEND_ORIGIN` - CORS origin (default: `http://localhost:3000`)
- `CLOUD_BUILD_LOCATION` - Cloud Build location (default: `global`)
- `BUILD_TIMEOUT_SECONDS` - Build timeout (default: `900`)
- `BUILD_QUEUE_TTL_SECONDS` - Queue TTL (default: `600`)
- `PREVIEW_URL_BASE` - Base URL for preview links

### Build Server (`build-server/`)

**Required:**
- `PROJECT_ID` - Unique project identifier
- `GIT_REPOSITORY_URL` - Git repository URL to clone
- `GCS_BUCKET` - Cloud Storage bucket name

**Optional:**
- `TRACE_ID` - Distributed trace identifier
- `REDIS_URL` - Redis connection string (for log streaming)
- `GCS_OUTPUT_PREFIX` - Output prefix (default: `__outputs`)
- `GCS_CACHE_CONTROL` - Cache control header (default: `public, max-age=60`)

### Reverse Proxy (`reverse-proxy/`)

**Required:**
- `GCS_BUCKET` - Cloud Storage bucket name

**Optional:**
- `PORT` - Server port (default: `8000`)
- `GCS_ASSET_BASE_URL` - Base URL for GCS assets (default: `https://storage.googleapis.com`)
- `GCS_OUTPUT_PREFIX` - Output prefix (default: `__outputs`)

---

##  Example `.env` Files

### GCP API Server `.env`
```bash
GCP_PROJECT_ID=your-project-id
BUILDER_IMAGE=us-central1-docker.pkg.dev/PROJECT/repo/builder:latest
GCS_BUCKET=your-bucket-name
REDIS_URL=rediss://default:PASSWORD@HOST:PORT
PREVIEW_URL_BASE=https://preview.example.com
```





