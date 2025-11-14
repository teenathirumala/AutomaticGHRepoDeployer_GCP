# GCP Deployment - Necessary Files Checklist

## Core Application Files 

### 1. **API Server** (`api-server/`)
- **`index.js`** - Main API server that triggers Cloud Build
  - Uses `@google-cloud/cloudbuild` SDK
  - Handles `/project` POST endpoint
  - Manages WebSocket server for log streaming
- **`package.json`** - Dependencies: `@google-cloud/cloudbuild`, `express`, `socket.io`, `ioredis`, `uuid`
- **`package-lock.json`** - Lock file for reproducible installs

### 2. **Build Server** (`build-server/`)
- **`Dockerfile`** - Container image definition for Cloud Build
  - Installs Node.js, Git
  - Sets up build environment
- **`main.sh`** - Entrypoint script that clones the repository
- **`script.js`** - Build script that:
  - Clones repo
  - Runs `npm install && npm run build`
  - Uploads artifacts to Cloud Storage
  - Publishes logs to Redis
- **`package.json`** - Dependencies: `@google-cloud/storage`, `ioredis`, `mime-types`, `uuid`
- **`.dockerignore`** - Excludes unnecessary files from Docker build

### 3. **Reverse Proxy** (`reverse-proxy/`)
- **`index.js`** - Proxies requests to Cloud Storage bucket
  - Uses `GCS_BUCKET` environment variable
  - Serves static files from `gs://bucket/__outputs/project-id/`
- **`package.json`** - Dependencies: `express`, `http-proxy`

### 4. **Frontend** (`frontend-nextjs/`)
- **`app/page.tsx`** - Main UI for submitting builds
- **`package.json`** - Next.js dependencies
- All other Next.js config files (standard Next.js setup)

---

##  Configuration Files

### 5. **Root Level**
- **`.gitignore`** - Excludes `node_modules`, `.env`, credentials
- **`README.md`** - Project documentation
- **`docs/DEPLOYMENT_GCP.md`** - Step-by-step GCP deployment guide

---


### GCP-Specific Configuration (created during deployment):

1. **Service Account Keys** (`.json` files)
   - Created in GCP Console
   - Stored in Secret Manager (not in repo)
   - Used for authentication

2. **Cloud Build Configuration** (optional `cloudbuild.yaml`)
   - Currently configured programmatically in `api-server/index.js`
   - Could be externalized to a YAML file if needed

3. **Environment Variables** (`.env` files - not committed)
   - `GCP_PROJECT_ID`
   - `GCS_BUCKET`
   - `BUILDER_IMAGE`
   - `REDIS_URL`
   - `PREVIEW_URL_BASE`
   - etc.



##  File Summary by Purpose

| File | Purpose | GCP Service Used |
|------|---------|------------------|
| `api-server/index.js` | Triggers builds | Cloud Build API |
| `build-server/Dockerfile` | Build container image | Artifact Registry → Cloud Build |
| `build-server/script.js` | Uploads artifacts | Cloud Storage |
| `reverse-proxy/index.js` | Serves previews | Cloud Storage (via proxy) |
| `api-server/package.json` | API dependencies | `@google-cloud/cloudbuild` |
| `build-server/package.json` | Build dependencies | `@google-cloud/storage` |

---



