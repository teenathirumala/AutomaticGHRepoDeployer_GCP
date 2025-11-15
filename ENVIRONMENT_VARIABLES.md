# Environment Variables

This document lists all required and optional environment variables for Azure implementations.

##  Azure Version (`azure` branch)

### API Server (`api-server/`)

**Required:**
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `AZURE_RESOURCE_GROUP` - Resource group name
- `AZURE_LOCATION` - Azure region (e.g., `eastus`)
- `BUILDER_IMAGE` - Container image for build server (e.g., `acrname.azurecr.io/builder:latest`)
- `AZURE_STORAGE_ACCOUNT_NAME` - Storage account name
- `REDIS_URL` - Redis connection string (optional, for log streaming)

**Optional:**
- `PORT` - API server port (default: `9000`)
- `SOCKET_PORT` - WebSocket server port (default: `9002`)
- `FRONTEND_ORIGIN` - CORS origin (default: `http://localhost:3000`)
- `AZURE_CONTAINER_GROUP_PREFIX` - Prefix for container group names (default: `build-`)
- `AZURE_BLOB_CONTAINER_NAME` - Blob container name (default: `build-outputs`)
- `PREVIEW_URL_BASE` - Base URL for preview links

### Build Server (`build-server/`)

**Required:**
- `PROJECT_ID` - Unique project identifier
- `GIT_REPOSITORY_URL` - Git repository URL to clone
- `AZURE_STORAGE_ACCOUNT_NAME` - Storage account name

**Optional:**
- `TRACE_ID` - Distributed trace identifier
- `REDIS_URL` - Redis connection string (for log streaming)
- `AZURE_BLOB_CONTAINER_NAME` - Blob container name (default: `build-outputs`)
- `AZURE_BLOB_PREFIX` - Blob prefix (default: `__outputs`)
- `AZURE_CACHE_CONTROL` - Cache control header (default: `public, max-age=60`)

### Reverse Proxy (`reverse-proxy/`)

**Required:**
- `AZURE_STORAGE_ACCOUNT_NAME` - Storage account name

**Optional:**
- `PORT` - Server port (default: `8000`)
- `AZURE_BLOB_CONTAINER_NAME` - Blob container name (default: `build-outputs`)
- `AZURE_BLOB_PREFIX` - Blob prefix (default: `__outputs`)

---

##  Example `.env` Files

### Azure API Server `.env`
```bash
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=your-resource-group
AZURE_LOCATION=eastus
BUILDER_IMAGE=acrname.azurecr.io/builder:latest
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_BLOB_CONTAINER_NAME=build-outputs
REDIS_URL=rediss://:PASSWORD@HOST:PORT
PREVIEW_URL_BASE=https://preview.example.com
```

---

**Note**: Replace example values with actual credentials and configuration.

