# Vercel Clone - Multi-Cloud Deployment

A full-stack application for building and deploying static sites from Git repositories, with implementations for both **AWS** and **Google Cloud Platform (GCP)**.

## 📁 Repository Structure

This repository contains **two separate implementations**:

- **`main` branch** → **AWS Version** (ECS, S3, EC2)
- **`gcp` branch** → **GCP Version** (Cloud Run, Cloud Build, Cloud Storage)

### Switching Between Versions

```bash
# View AWS version (default)
git checkout main

# View GCP version
git checkout gcp
```

## 🏗️ Architecture

### AWS Version (`main` branch)
- **API Server**: Express server on EC2 that triggers ECS tasks
- **Build Server**: Containerized ECS task that builds projects and uploads to S3
- **Socket Server**: WebSocket server for real-time log streaming (embedded in API server)
- **Reverse Proxy**: Serves static assets from S3

### GCP Version (`gcp` branch)
- **API Server**: Cloud Run service that triggers Cloud Build
- **Build Server**: Cloud Build worker that builds projects and uploads to Cloud Storage
- **Socket Server**: WebSocket server for real-time log streaming (embedded in API server)
- **Reverse Proxy**: Cloud Run service that serves static assets from Cloud Storage

## 🚀 Quick Start

### AWS Version

1. **Install dependencies**:
   ```bash
   cd api-server && npm install
   cd ../build-server && npm install
   cd ../s3-reverse-proxy && npm install
   ```

2. **Set environment variables** (see `ENVIRONMENT_VARIABLES.md`)

3. **Deploy**:
   - Deploy API server to EC2
   - Deploy build server as ECS task
   - Deploy reverse proxy to EC2

### GCP Version

1. **Switch to GCP branch**:
   ```bash
   git checkout gcp
   ```

2. **Follow deployment guide**:
   ```bash
   cat docs/DEPLOYMENT_GCP.md
   ```

## 📊 Comparison

For detailed comparison between AWS and GCP implementations, see `COMPARISON.md`.

## 🔐 Environment Variables

See `ENVIRONMENT_VARIABLES.md` for required environment variables for each version.

## 📝 Features

- ✅ Multi-cloud support (AWS & GCP)
- ✅ Real-time build log streaming via WebSockets
- ✅ Distributed tracing with trace IDs
- ✅ Cloud-native observability
- ✅ Environment-based configuration
- ✅ Containerized build pipeline

## 📚 Documentation

- **AWS Deployment**: See code comments and environment variables
- **GCP Deployment**: See `docs/DEPLOYMENT_GCP.md` (in `gcp` branch)
- **Environment Variables**: See `ENVIRONMENT_VARIABLES.md`
- **Comparison**: See `COMPARISON.md`

## 🔬 For Research Paper

This project is designed for comparing AWS vs GCP performance. Both implementations include:
- Timing measurements at each service stage
- Distributed tracing with trace IDs
- Cloud-native observability integration

## 📄 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Note**: Make sure you're on the correct branch (`main` for AWS, `gcp` for GCP) before deploying!
