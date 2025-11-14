# Environment Variables

This document lists all required and optional environment variables for AWS, GCP, and Azure implementations.

## 🔵 AWS Version (`main` branch)

### API Server (`api-server/`)

**Required:**
- `REDIS_URL` - Redis connection string (e.g., `rediss://default:PASSWORD@HOST:PORT`)
- `AWS_REGION` - AWS region (default: `ap-south-1`)
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_ECS_CLUSTER` - ECS cluster ARN (e.g., `arn:aws:ecs:region:account:cluster/name`)
- `AWS_ECS_TASK_DEFINITION` - ECS task definition ARN

**Optional:**
- `PORT` - API server port (default: `9000`)
- `SOCKET_PORT` - WebSocket server port (default: `9002`)
- `FRONTEND_ORIGIN` - CORS origin (default: `http://localhost:3000`)

### Build Server (`build-server/`)

**Required:**
- `PROJECT_ID` - Unique project identifier (set by ECS task)
- `GIT_REPOSITORY__URL` - Git repository URL to clone (set by ECS task)
- `REDIS_URL` - Redis connection string
- `AWS_REGION` - AWS region
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `S3_BUCKET` - S3 bucket name (default: `vercel-clone-miniproject2`)

### Reverse Proxy (`reverse-proxy/`)

**Required:**
- `S3_BUCKET` - S3 bucket name
- `S3_REGION` - S3 region

**Optional:**
- `PORT` - Server port (default: `8000`)

---

## 🟢 GCP Version (`gcp` branch)

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

## 🔒 Security Best Practices

1. **Never commit secrets to git** - Use environment variables or secret managers
2. **Use Secret Manager**:
   - AWS: AWS Secrets Manager or Parameter Store
   - GCP: Secret Manager
3. **Use IAM roles** when possible instead of access keys
4. **Rotate credentials** regularly

## 📝 Example `.env` Files

### AWS API Server `.env`
```bash
REDIS_URL=rediss://default:PASSWORD@HOST:PORT
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ECS_CLUSTER=arn:aws:ecs:ap-south-1:ACCOUNT:cluster/CLUSTER_NAME
AWS_ECS_TASK_DEFINITION=arn:aws:ecs:ap-south-1:ACCOUNT:task-definition/TASK_NAME
PORT=9000
SOCKET_PORT=9002
```

### GCP API Server `.env`
```bash
GCP_PROJECT_ID=your-project-id
BUILDER_IMAGE=us-central1-docker.pkg.dev/PROJECT/repo/builder:latest
GCS_BUCKET=your-bucket-name
REDIS_URL=rediss://default:PASSWORD@HOST:PORT
PREVIEW_URL_BASE=https://preview.example.com
```

---

## 🔷 Azure Version (`azure` branch)

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

## 🔒 Security Best Practices

1. **Never commit secrets to git** - Use environment variables or secret managers
2. **Use Secret Manager**:
   - AWS: AWS Secrets Manager or Parameter Store
   - GCP: Secret Manager
   - Azure: Key Vault
3. **Use Managed Identity** (Azure) or IAM roles (AWS/GCP) when possible instead of access keys
4. **Rotate credentials** regularly

## 📝 Example `.env` Files

### AWS API Server `.env`
```bash
REDIS_URL=rediss://default:PASSWORD@HOST:PORT
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ECS_CLUSTER=arn:aws:ecs:ap-south-1:ACCOUNT:cluster/CLUSTER_NAME
AWS_ECS_TASK_DEFINITION=arn:aws:ecs:ap-south-1:ACCOUNT:task-definition/TASK_NAME
PORT=9000
SOCKET_PORT=9002
```

### GCP API Server `.env`
```bash
GCP_PROJECT_ID=your-project-id
BUILDER_IMAGE=us-central1-docker.pkg.dev/PROJECT/repo/builder:latest
GCS_BUCKET=your-bucket-name
REDIS_URL=rediss://default:PASSWORD@HOST:PORT
PREVIEW_URL_BASE=https://preview.example.com
```

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

**Note**: These are example values. Replace with your actual credentials and configuration.

