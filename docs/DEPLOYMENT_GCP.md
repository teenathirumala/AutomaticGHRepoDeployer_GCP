## GCP Deployment Guide

This project is now wired to run entirely on Google Cloud Platform. Follow the steps below to provision the infrastructure, build container images, deploy the services, and validate an end-to-end preview build.

---

### 1. Prerequisites

- Google Cloud project with billing enabled.
- `gcloud` CLI (≥ 445) and Docker.
- Node.js 18+ for local tooling.
- Service account with IAM roles:
  - `roles/run.admin`
  - `roles/cloudbuild.builds.editor`
  - `roles/artifactregistry.admin`
  - `roles/storage.admin`
  - `roles/redis.admin`
  - `roles/logging.configWriter`
  - `roles/monitoring.editor`
- Enable APIs:
  `cloudresourcemanager`, `iam`, `compute`, `run`, `artifactregistry`,
  `cloudbuild`, `redis`, `cloudtrace`, `logging`, `monitoring`, `storage`,
  `iamcredentials`.

```
gcloud services enable \
  run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com \
  redis.googleapis.com cloudtrace.googleapis.com logging.googleapis.com \
  monitoring.googleapis.com storage.googleapis.com iamcredentials.googleapis.com
```

---

### 2. Artifact Registry & Container Images

1. Create repositories:
   ```
   gcloud artifacts repositories create vercel-clone \
     --repository-format=docker --location=us-central1
   ```
2. Build & push the **builder image** (used by Cloud Build to build user projects):
   ```
   export REGION=us-central1
   export PROJECT_ID=YOUR_PROJECT
   export REPO=vercel-clone

   # Option A: Using cloudbuild.yaml (recommended)
   cd build-server
   gcloud builds submit . \
     --config=cloudbuild.yaml \
     --substitutions=_ARTIFACT_REGISTRY=${REGION}-docker.pkg.dev,_PROJECT_ID=${PROJECT_ID},_BUILDER_IMAGE_NAME=builder,_IMAGE_TAG=latest

   # Option B: Direct docker build
   docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/builder:latest .
   docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/builder:latest
   ```

3. Build & push other service images:
   ```
   # API / socket
   gcloud builds submit api-server \
     --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/api-server:latest

   # Build worker
   gcloud builds submit build-server \
     --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/build-server:latest

   # Reverse proxy
   gcloud builds submit reverse-proxy \
     --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/reverse-proxy:latest
   ```

---

### 3. Memorystore (Redis)

```
gcloud redis instances create vercel-clone \
  --region=us-central1 --tier=standard --size=1 \
  --replica-count=1 --transit-encryption-mode=server-authentication
```

Capture the host/port and construct:
`rediss://:<auth>@HOST:PORT`.

---

### 4. Cloud Storage & CDN

```
gsutil mb -c standard -l us-central1 gs://vercel-clone-previews
gsutil uniformbucketlevelaccess set on gs://vercel-clone-previews
```

Optionally attach Cloud CDN:
- Create HTTPS Load Balancer with backend bucket pointing to `vercel-clone-previews`.
- Point your preview domain (e.g., `preview.example.com`) at the load balancer.

Environment variables (used by API + reverse proxy):
- `GCS_BUCKET=vercel-clone-previews`
- `GCS_OUTPUT_PREFIX=__outputs`
- `PREVIEW_URL_BASE=https://preview.example.com`
- `GCS_ASSET_BASE_URL=https://storage.googleapis.com`

---

### 5. Cloud Build Trigger

The API server invokes Cloud Build directly; no trigger required, but grant its service account the `cloudbuild.builds.editor` role. The build step uses the `build-server` image as a worker.

Environment variables required by Cloud Build step:

- `BUILDER_IMAGE=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/build-server:latest`
- `BUILDER_ENTRYPOINT=node`
- `BUILDER_ARGS=["script.js"]`
- `BUILD_LOGGING=CLOUD_LOGGING_ONLY`
- Optional timeouts: `BUILD_TIMEOUT_SECONDS`, `BUILD_QUEUE_TTL_SECONDS`.

---

### 6. Create Service Accounts

Create service accounts for each service with appropriate permissions:

```
# API Server service account
gcloud iam service-accounts create api-server \
  --display-name="API Server Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:api-server@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:api-server@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:api-server@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Reverse Proxy service account (minimal permissions)
gcloud iam service-accounts create reverse-proxy \
  --display-name="Reverse Proxy Service Account"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:reverse-proxy@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

---

### 7. Deploy Cloud Run Services

#### API / Socket service

```
gcloud run deploy api-server \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/api-server:latest \
  --region=${REGION} \
  --port=9000 \
  --set-env-vars=PORT=9000,SOCKET_PORT=9002,\
GCP_PROJECT_ID=${PROJECT_ID},CLOUD_BUILD_LOCATION=${REGION},\
BUILDER_IMAGE=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/build-server:latest,\
GCS_BUCKET=vercel-clone-previews,PREVIEW_URL_BASE=https://preview.example.com,\
REDIS_URL=rediss://:PASSWORD@HOST:PORT \
  --service-account=api-server@${PROJECT_ID}.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --cpu=1 \
  --memory=512Mi
```

Create a VPC connector if Memorystore is deployed in a VPC and attach it via `--vpc-connector`.

The Socket.IO server is embedded and listens on `SOCKET_PORT`. To expose WebSockets externally, configure a second Cloud Run revision with the same image but different port, or front both with Cloud Run domain mappings + Cloud Load Balancing. In simple setups, Cloud Run handles both HTTP + WebSocket on the same URL.

#### Reverse proxy

```
gcloud run deploy preview-proxy \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/reverse-proxy:latest \
  --region=${REGION} \
  --port=8000 \
  --set-env-vars=PORT=8000,GCS_BUCKET=vercel-clone-previews,\
GCS_OUTPUT_PREFIX=__outputs,GCS_ASSET_BASE_URL=https://storage.googleapis.com \
  --allow-unauthenticated
```

Map your preview domain to this Cloud Run service or place it behind the HTTPS Load Balancer.

---

### 8. IAM & Secrets

- Store sensitive values (Redis password, GitHub tokens) in Secret Manager:
  ```
  gcloud secrets create redis-uri --data-file=redis-uri.txt
  gcloud run services update api-server --set-secrets=REDIS_URL=redis-uri:latest
  ```
- Grant `Secret Manager Secret Accessor` to service accounts.

---

### 9. Observability

- Cloud Logging automatically collects stdout/stderr. Ensure log lines contain `traceId` (already from code).
- Enable Cloud Trace by exporting OTEL spans (optional). For now, search logs by `jsonPayload.traceId`.
- Create Cloud Monitoring dashboards for:
  - Cloud Build build duration (metric `build/build_duration`).
  - Cloud Run request latency.
  - Memorystore command latency (`redis.googleapis.com/stats/command_latency`).
  - Storage backend latency via load balancer logs.

---

### 10. End-to-End Test

1. Call the API endpoint (`/project`) with a Git repository URL.
2. Watch Cloud Build job progress:
   ```
   gcloud builds log --stream BUILD_NAME
   ```
3. Verify objects uploaded to `gs://vercel-clone-previews/__outputs/<slug>/`.
4. Hit the preview domain to confirm the reverse proxy renders the static site.
5. Gather per-stage timings from Cloud Build logs, Cloud Run request logs, and Memorystore metrics.



With these steps complete, the Vercel-style workflow runs entirely on GCP. Update your paper with measured timings per service (Cloud Build duration, Cloud Run latency, Memorystore command latency, Cloud Storage fetch time) sourced from the GCP monitoring stack.

