# Multi-Cloud Deployment

A full-stack application for building and deploying static sites from Git repositories, with implementations for **AWS**, **Google Cloud Platform (GCP)**, and **Microsoft Azure**.

## 📁 Repository Structure

This repository contains **three separate implementations**, each on its own branch:

- **`main` branch** → **AWS Version** (ECS, S3, EC2)
- **`gcp` branch** → **GCP Version** (Cloud Run, Cloud Build, Cloud Storage)
- **`azure` branch** → **Azure Version** (Container Apps, Container Instances, Blob Storage)

### Project Folders

Each branch contains the following core services:

```
├── api-server/          # API server (triggers builds, handles WebSocket connections)
├── build-server/        # Build service (clones repo, builds, uploads artifacts)
├── reverse-proxy/       # Reverse proxy (serves static assets from cloud storage)
├── frontend-nextjs/     # Next.js frontend application
├── docs/                # Deployment guides and documentation
├── COMPARISON.md        # Detailed comparison of all three cloud implementations
└── ENVIRONMENT_VARIABLES.md  # Environment variables for each cloud provider
```

### Switching Between Versions

```bash
# View AWS version (default)
git checkout main

# View GCP version
git checkout gcp

# View Azure version
git checkout azure
```

## 🏗️ Architecture

### AWS Version (`main` branch)
- **API Server**: Express server on EC2 that triggers ECS tasks
- **Build Server**: Containerized ECS Fargate task that builds projects and uploads to S3
- **Socket Server**: WebSocket server for real-time log streaming (embedded in API server)
- **Reverse Proxy**: Express server on EC2 that serves static assets from S3
- **Storage**: Amazon S3 bucket for build artifacts
- **Messaging**: Redis (Aiven/Valkey) for log streaming

### GCP Version (`gcp` branch)
- **API Server**: Cloud Run service that triggers Cloud Build
- **Build Server**: Cloud Build worker that builds projects and uploads to Cloud Storage
- **Socket Server**: WebSocket server for real-time log streaming (embedded in API server)
- **Reverse Proxy**: Cloud Run service that serves static assets from Cloud Storage
- **Storage**: Google Cloud Storage bucket for build artifacts
- **Messaging**: Memorystore for Redis or Cloud Pub/Sub

### Azure Version (`azure` branch)
- **API Server**: Container Apps service that triggers Container Instances
- **Build Server**: Container Instance that builds projects and uploads to Blob Storage
- **Socket Server**: WebSocket server for real-time log streaming (embedded in API server)
- **Reverse Proxy**: Container Apps service that serves static assets from Blob Storage
- **Storage**: Azure Blob Storage container for build artifacts
- **Messaging**: Azure Cache for Redis

## 🚀 Quick Start

### AWS Version (`main` branch)

1. **Switch to AWS branch** (if not already):
   ```bash
   git checkout main
   ```

2. **Install dependencies**:
   ```bash
   cd api-server && npm install
   cd ../build-server && npm install
   cd ../reverse-proxy && npm install
   ```

3. **Set environment variables** (see `ENVIRONMENT_VARIABLES.md`)

4. **Deploy** to EC2 and ECS (see code comments for deployment steps)

### GCP Version (`gcp` branch)

1. **Switch to GCP branch**:
   ```bash
   git checkout gcp
   ```

2. **Follow the detailed deployment guide**:
   ```bash
   cat docs/DEPLOYMENT_GCP.md
   ```

3. **Key steps**:
   - Create GCP project and enable APIs
   - Set up Artifact Registry
   - Deploy to Cloud Run
   - Configure Cloud Build
   - Set up Cloud Storage

### Azure Version (`azure` branch)

1. **Switch to Azure branch**:
   ```bash
   git checkout azure
   ```

2. **Follow the detailed deployment guide**:
   ```bash
   cat docs/DEPLOYMENT_AZURE.md
   ```

3. **Key steps**:
   - Create Azure Resource Group
   - Set up Azure Container Registry (ACR)
   - Deploy to Container Apps
   - Configure Container Instances
   - Set up Blob Storage

## 📊 Comparison

For a detailed comparison between AWS, GCP, and Azure implementations covering:
- Service mapping and architecture
- Cost analysis
- Performance characteristics
- Deployment complexity
- Security features
- Scalability options

See `COMPARISON.md`.

## 🔧 Environment Variables

See `ENVIRONMENT_VARIABLES.md` for:
- Required and optional environment variables for each cloud provider
- Security best practices
- Configuration examples

## ✨ Features

- **Multi-cloud support**: AWS, GCP, and Azure implementations
- **Real-time build logs**: WebSocket streaming for live build progress
- **Distributed tracing**: Trace IDs for end-to-end request tracking
- **Cloud-native observability**: Integrated with CloudWatch, Cloud Logging, and Azure Monitor
- **Environment-based configuration**: All secrets and config via environment variables
- **Containerized build pipeline**: Docker-based builds for consistency
- **Auto-scaling**: Serverless/container-based services scale automatically
- **Health checks**: Built-in health endpoints for all services

## 📚 Documentation

- **AWS Deployment**: See code comments and `ENVIRONMENT_VARIABLES.md`
- **GCP Deployment**: See `docs/DEPLOYMENT_GCP.md` (in `gcp` branch)
- **Azure Deployment**: See `docs/DEPLOYMENT_AZURE.md` (in `azure` branch)
- **Azure Implementation Summary**: See `docs/AZURE_IMPLEMENTATION_SUMMARY.md` (in `azure` branch)
- **Environment Variables**: See `ENVIRONMENT_VARIABLES.md`
- **Comparison**: See `COMPARISON.md`

## 📈 For Research Paper

This project is designed for comparing AWS vs GCP vs Azure performance and architecture. All implementations include:

- **Timing measurements**: Timestamps at each service stage (API request, build start, build completion, upload time)
- **Distributed tracing**: Trace IDs propagated across all services for end-to-end tracking
- **Cloud-native observability**: Integration with each provider's monitoring and logging services
- **Consistent architecture**: Same application logic across all three clouds for fair comparison
- **Performance metrics**: Ready for measuring latency, throughput, and cost

### Metrics to Measure

- API server response time
- Build duration (git clone → npm install → npm build)
- Storage upload time
- End-to-end request latency
- Cost per build
- Scalability characteristics

## 🔐 Security

- All credentials via environment variables (no hardcoded secrets)
- Cloud-native authentication (IAM roles, Service Accounts, Managed Identity)
- Support for secret management services (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
- Health check endpoints for monitoring

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## ⚠️ Important Notes

- **Branch Selection**: Make sure you're on the correct branch (`main` for AWS, `gcp` for GCP, `azure` for Azure) before deploying!
- **Environment Variables**: Each cloud provider requires different environment variables. See `ENVIRONMENT_VARIABLES.md` for details.
- **Docker Images**: Build and push Docker images to the respective container registries (ECR, Artifact Registry, ACR) before deploying.
- **Service Names**: The `reverse-proxy` folder is named generically and works with S3 (AWS), Cloud Storage (GCP), and Blob Storage (Azure) depending on the branch.
