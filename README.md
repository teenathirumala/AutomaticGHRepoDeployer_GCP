# Vercel Clone - GCP Deployment

A full-stack application for building and deploying static sites from Git repositories, deployed on Google Cloud Platform (GCP).

## Architecture

This project consists of:

- **API Server**: Handles project build requests and triggers builds via Cloud Build
- **Socket Server**: Streams real-time build logs to the frontend via WebSockets
- **Build Server**: Containerized service that clones repositories, builds projects, and uploads artifacts to Cloud Storage
- **Reverse Proxy**: Serves built static assets from Cloud Storage
- **Frontend**: Next.js application for submitting builds and viewing logs

## Project Structure

```
miniproject2/
├── api-server/          # Express API server (Cloud Run)
├── build-server/        # Build container (Cloud Build)
├── s3-reverse-proxy/    # Reverse proxy for static assets (Cloud Run)
├── frontend-nextjs/     # Next.js frontend application
└── docs/                # Deployment documentation
```

## Features

- ✅ GCP-native deployment (Cloud Run, Cloud Build, Cloud Storage)
- ✅ Real-time build log streaming via WebSockets
- ✅ Distributed tracing with trace IDs
- ✅ Cloud-native observability (Cloud Logging, Cloud Trace)
- ✅ Environment-based configuration
- ✅ Containerized build pipeline

## Prerequisites

- Node.js 18+ and npm
- Docker (for building container images)
- Google Cloud SDK (`gcloud`) for GCP deployment
- AWS CLI for AWS deployment (optional)

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   cd api-server && npm install
   cd ../build-server && npm install
   cd ../s3-reverse-proxy && npm install
   cd ../frontend-nextjs && npm install
   ```

2. **Set environment variables**:
   - Create `.env` files in each service directory
   - See `docs/DEPLOYMENT_GCP.md` for required variables

3. **Run services**:
   ```bash
   # Terminal 1: API Server
   cd api-server && npm start
   
   # Terminal 2: Socket Server (runs with API server)
   
   # Terminal 3: Reverse Proxy
   cd s3-reverse-proxy && npm start
   
   # Terminal 4: Frontend
   cd frontend-nextjs && npm run dev
   ```

## Deployment

### GCP Deployment

See [docs/DEPLOYMENT_GCP.md](docs/DEPLOYMENT_GCP.md) for detailed step-by-step instructions.

**Quick summary**:
1. Enable required GCP APIs
2. Create Artifact Registry repository
3. Build and push container images
4. Provision Memorystore (Redis)
5. Create Cloud Storage bucket
6. Deploy services to Cloud Run
7. Configure reverse proxy and load balancer

### AWS Deployment

**Note**: This codebase is currently configured for GCP only. For AWS deployment comparison, you would need a separate version using:
- AWS ECS (instead of Cloud Build)
- S3 (instead of Cloud Storage)
- EC2/ALB (instead of Cloud Run)

The original AWS version can be found in your git history or you can create a separate branch for AWS comparison.

## Environment Variables

### API Server
- `GCP_PROJECT_ID`: GCP project ID (required for GCP)
- `BUILDER_IMAGE`: Container image for build server
- `GCS_BUCKET`: Cloud Storage bucket name
- `REDIS_URL`: Redis connection string (optional)
- `PORT`: Server port (default: 9000)
- `SOCKET_PORT`: WebSocket server port (default: 9002)
- `FRONTEND_ORIGIN`: CORS origin (default: http://localhost:3000)
- `PREVIEW_URL_BASE`: Base URL for preview links

### Build Server
- `PROJECT_ID`: Unique project identifier
- `GIT_REPOSITORY_URL`: Git repository to clone and build
- `GCS_BUCKET`: Cloud Storage bucket for artifacts
- `TRACE_ID`: Distributed trace identifier
- `REDIS_URL`: Redis connection for log streaming

### Reverse Proxy
- `GCS_BUCKET`: Cloud Storage bucket name
- `GCS_ASSET_BASE_URL`: Base URL for GCS assets
- `GCS_OUTPUT_PREFIX`: Prefix for build outputs (default: `__outputs`)
- `PORT`: Server port (default: 8000)

## Observability

The application includes built-in observability features:

- **Distributed Tracing**: Trace IDs propagate through all services
- **Structured Logging**: JSON logs compatible with Cloud Logging
- **Timing Metrics**: Each build stage logs timestamps for performance analysis
- **Cloud Monitoring**: Integration with GCP Cloud Monitoring

## Development

### Building Container Images

```bash
# Build server image
cd build-server
docker build -t gcr.io/YOUR_PROJECT_ID/builder:latest .
docker push gcr.io/YOUR_PROJECT_ID/builder:latest
```

### Testing

1. Submit a build request:
   ```bash
   curl -X POST http://localhost:9000/project \
     -H "Content-Type: application/json" \
     -H "X-Trace-Id: test-trace-123" \
     -d '{"gitURL": "https://github.com/user/repo.git"}'
   ```

2. Monitor logs via WebSocket connection to the socket server

3. Access preview at the returned URL

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

