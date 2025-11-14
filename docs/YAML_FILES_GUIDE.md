# YAML Configuration Files Guide

This document explains all the YAML files in the repository and how to use them.

## 📋 Available YAML Files

### 1. `.github/workflows/azure-deploy.yml`
**Purpose**: GitHub Actions workflow for automated Azure deployment

**What it does**:
- Triggers on pushes to `azure` branch
- Builds and pushes container images to Azure Container Registry (ACR)
- Deploys updated images to Container Apps

**Usage**:
1. Set up Azure credentials in GitHub Secrets:
   - `AZURE_CREDENTIALS` (service principal JSON)
2. Push to `azure` branch - deployment happens automatically

**Services built**:
- `api-server`
- `reverse-proxy`
- `builder`

---

### 2. `azure-pipelines.yml`
**Purpose**: Azure DevOps Pipeline for CI/CD

**What it does**:
- Builds all container images
- Pushes to ACR
- Deploys to Container Apps

**Usage**:
1. Create Azure DevOps project
2. Connect to Azure (create service connection)
3. Configure ACR connection
4. Run pipeline on `azure` branch

**Stages**:
- **Build**: Builds and pushes images
- **Deploy**: Updates Container Apps with new images

---

### 3. `azure-container-apps.yaml`
**Purpose**: Declarative Container Apps configuration

**What it does**:
- Defines API server and reverse proxy Container Apps
- Specifies environment variables, scaling, resources

**Usage**:
```bash
# Deploy using Azure CLI
az containerapp create \
  --yaml azure-container-apps.yaml \
  --resource-group YOUR_RG
```

**Note**: Replace placeholders like `{subscription-id}`, `{resource-group}`, `{acr-name}` with actual values.

---

### 4. `docker-compose.yml`
**Purpose**: Local development and testing

**What it does**:
- Runs API server and reverse proxy locally in Docker
- Useful for testing before deploying to Azure

**Usage**:
```bash
# Create .env file with your Azure credentials
cp .env.example .env
# Edit .env with your values

# Start services
docker-compose up

# Or run in background
docker-compose up -d
```

**Services**:
- `api-server` on port 9000 (API) and 9002 (WebSocket)
- `reverse-proxy` on port 8000
- Optional: `redis` for local testing

---

### 5. `build-server/azure-pipelines-build.yaml`
**Purpose**: Separate pipeline for building builder image

**What it does**:
- Builds only the builder image
- Useful when only build-server code changes

**Usage**:
- Set up as separate pipeline in Azure DevOps
- Triggers when `build-server/` files change

---

## 🔄 Comparison with Other Clouds

### GCP
- **GCP**: `build-server/cloudbuild.yaml` - Builds builder image
- **Azure**: `azure-pipelines.yml` or GitHub Actions - Builds all images

### AWS
- **AWS**: Typically uses CodePipeline or manual builds
- **Azure**: Uses Azure DevOps or GitHub Actions

---

## 🚀 Quick Start

### Option 1: GitHub Actions (Recommended)
1. Add `AZURE_CREDENTIALS` secret to GitHub
2. Push to `azure` branch
3. Watch deployment in Actions tab

### Option 2: Azure DevOps
1. Import `azure-pipelines.yml`
2. Configure service connections
3. Run pipeline

### Option 3: Manual Deployment
1. Use `docs/DEPLOYMENT_AZURE.md` for step-by-step commands
2. No YAML needed

### Option 4: Local Testing
1. Use `docker-compose.yml`
2. Test locally before deploying

---

## 📝 YAML File Locations

```
miniproject2/
├── .github/
│   └── workflows/
│       └── azure-deploy.yml          # GitHub Actions
├── azure-pipelines.yml                # Azure DevOps
├── azure-container-apps.yaml         # Container Apps config
├── docker-compose.yml                 # Local development
└── build-server/
    └── azure-pipelines-build.yaml     # Builder image pipeline
```

---

## 🔧 Customization

All YAML files use variables that you can customize:
- Resource group name
- ACR name
- Location/region
- Image tags
- Scaling limits

Edit the files to match your Azure setup.

---

**Note**: These YAML files are optional. You can deploy manually using the commands in `docs/DEPLOYMENT_AZURE.md` if you prefer.

