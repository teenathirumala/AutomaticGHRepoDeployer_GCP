# Azure Deployment Guide

This project is configured to run entirely on Microsoft Azure. Follow the steps below to provision the infrastructure, build container images, deploy the services, and validate an end-to-end preview build.

---

## Prerequisites

- Azure subscription with billing enabled
- Azure CLI (`az`) installed and configured
- Docker installed
- Node.js 18+ for local tooling
- Service Principal or Managed Identity with appropriate permissions

### Required Azure Permissions

Your service principal or user account needs:
- `Contributor` role (or specific roles: `Container Instance Contributor`, `Storage Account Contributor`, `Redis Cache Contributor`)
- Ability to create Resource Groups
- Ability to create Container Instances
- Ability to create Storage Accounts
- Ability to create Azure Cache for Redis

### Enable Required Providers

```bash
az provider register --namespace Microsoft.ContainerInstance
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.Cache
az provider register --namespace Microsoft.App
```

---

## 1. Create Resource Group

```bash
export RESOURCE_GROUP="vercel-clone-rg"
export LOCATION="eastus"

az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

---

## 2. Azure Container Registry (ACR)

### Create ACR

```bash
export ACR_NAME="vercelclone$(openssl rand -hex 3)"
export ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"

az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

### Get ACR credentials

```bash
export ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
export ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
```

---

## 3. Build and Push Container Images

### Build Server Image

```bash
cd build-server

# Build and push builder image
az acr build \
  --registry $ACR_NAME \
  --image builder:latest \
  --file Dockerfile .
```

### API Server Image

```bash
cd ../api-server

az acr build \
  --registry $ACR_NAME \
  --image api-server:latest \
  --file Dockerfile .
```

### Reverse Proxy Image

```bash
cd ../reverse-proxy

az acr build \
  --registry $ACR_NAME \
  --image reverse-proxy:latest \
  --file Dockerfile .
```

---

## 4. Azure Cache for Redis

```bash
export REDIS_NAME="vercel-clone-redis"

az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --location $LOCATION \
  --sku Basic \
  --vm-size c0

# Get Redis connection details
export REDIS_HOST=$(az redis show \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --query hostName -o tsv)

export REDIS_PORT=$(az redis show \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --query port -o tsv)

export REDIS_KEY=$(az redis list-keys \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --query primaryKey -o tsv)

export REDIS_URL="rediss://:${REDIS_KEY}@${REDIS_HOST}:${REDIS_PORT}"
```

---

## 5. Azure Storage Account & Blob Container

```bash
export STORAGE_ACCOUNT_NAME="vercelclone$(openssl rand -hex 3)"

az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name $STORAGE_ACCOUNT_NAME \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Create blob container
az storage container create \
  --account-name $STORAGE_ACCOUNT_NAME \
  --name build-outputs \
  --public-access blob

# Get storage account key (if needed for access)
export STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT_NAME \
  --query [0].value -o tsv)
```

---

## 6. Create Service Principal (for Container Instances)

```bash
export SP_NAME="vercel-clone-sp"

az ad sp create-for-rbac \
  --name $SP_NAME \
  --role Contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv)

# Save the output - you'll need:
# appId (clientId)
# password (clientSecret)
# tenant
```

---

## 7. Deploy API Server to Azure Container Apps

### Create Container Apps Environment

```bash
export CONTAINER_APP_ENV="vercel-clone-env"

az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### Deploy API Server

```bash
export SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az containerapp create \
  --name api-server \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image ${ACR_LOGIN_SERVER}/api-server:latest \
  --registry-server ${ACR_LOGIN_SERVER} \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 9000 \
  --ingress external \
  --env-vars \
    PORT=9000 \
    SOCKET_PORT=9002 \
    AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID \
    AZURE_RESOURCE_GROUP=$RESOURCE_GROUP \
    AZURE_LOCATION=$LOCATION \
    AZURE_CONTAINER_GROUP_PREFIX=build- \
    BUILDER_IMAGE=${ACR_LOGIN_SERVER}/builder:latest \
    AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME \
    AZURE_BLOB_CONTAINER_NAME=build-outputs \
    REDIS_URL=$REDIS_URL \
    PREVIEW_URL_BASE=https://preview.example.com \
    FRONTEND_ORIGIN=https://your-frontend-domain.com \
  --cpu 1.0 \
  --memory 2.0Gi \
  --min-replicas 0 \
  --max-replicas 10
```

### Deploy Reverse Proxy

```bash
az containerapp create \
  --name reverse-proxy \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image ${ACR_LOGIN_SERVER}/reverse-proxy:latest \
  --registry-server ${ACR_LOGIN_SERVER} \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 8000 \
  --ingress external \
  --env-vars \
    PORT=8000 \
    AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME \
    AZURE_BLOB_CONTAINER_NAME=build-outputs \
    AZURE_BLOB_PREFIX=__outputs \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 0 \
  --max-replicas 10
```

---

## 8. Grant Permissions

The API server needs permissions to create Container Instances:

```bash
# Get the managed identity for the container app
export API_SERVER_IDENTITY=$(az containerapp show \
  --name api-server \
  --resource-group $RESOURCE_GROUP \
  --query identity.principalId -o tsv)

# Grant Container Instance Contributor role
az role assignment create \
  --assignee $API_SERVER_IDENTITY \
  --role "Container Instance Contributor" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP
```

---

## 9. Configure Blob Storage Access

Ensure the blob container allows public read access for preview URLs:

```bash
az storage container set-permission \
  --account-name $STORAGE_ACCOUNT_NAME \
  --name build-outputs \
  --public-access blob
```

---

## 10. Environment Variables Summary

### API Server
- `AZURE_SUBSCRIPTION_ID` - Your Azure subscription ID
- `AZURE_RESOURCE_GROUP` - Resource group name
- `AZURE_LOCATION` - Azure region (e.g., `eastus`)
- `AZURE_CONTAINER_GROUP_PREFIX` - Prefix for container group names
- `BUILDER_IMAGE` - Full image path (e.g., `acrname.azurecr.io/builder:latest`)
- `AZURE_STORAGE_ACCOUNT_NAME` - Storage account name
- `AZURE_BLOB_CONTAINER_NAME` - Blob container name (default: `build-outputs`)
- `REDIS_URL` - Redis connection string
- `PREVIEW_URL_BASE` - Base URL for preview links
- `FRONTEND_ORIGIN` - CORS origin

### Build Server (Container Instance)
- `GIT_REPOSITORY_URL` - Git repository to clone
- `PROJECT_ID` - Unique project identifier
- `TRACE_ID` - Distributed trace ID
- `AZURE_STORAGE_ACCOUNT_NAME` - Storage account name
- `AZURE_BLOB_CONTAINER_NAME` - Blob container name
- `REDIS_URL` - Redis connection (optional)

### Reverse Proxy
- `AZURE_STORAGE_ACCOUNT_NAME` - Storage account name
- `AZURE_BLOB_CONTAINER_NAME` - Blob container name
- `AZURE_BLOB_PREFIX` - Blob prefix (default: `__outputs`)

---

## 11. End-to-End Test

1. **Get API server URL**:
   ```bash
   az containerapp show \
     --name api-server \
     --resource-group $RESOURCE_GROUP \
     --query properties.configuration.ingress.fqdn -o tsv
   ```

2. **Submit a build request**:
   ```bash
   curl -X POST https://YOUR_API_URL/project \
     -H "Content-Type: application/json" \
     -H "X-Trace-Id: test-trace-123" \
     -d '{"gitURL": "https://github.com/user/repo.git"}'
   ```

3. **Monitor Container Instances**:
   ```bash
   az container list \
     --resource-group $RESOURCE_GROUP \
     --query "[].{Name:name,State:instanceView.state}" -o table
   ```

4. **Check blob storage**:
   ```bash
   az storage blob list \
     --account-name $STORAGE_ACCOUNT_NAME \
     --container-name build-outputs \
     --prefix "__outputs/" \
     --output table
   ```

5. **Access preview** via reverse proxy URL

---

## 12. Observability

### Azure Monitor

- **Container Instances**: View logs via `az container logs`
- **Container Apps**: Logs available in Azure Portal → Container Apps → Log stream
- **Storage**: Metrics available in Azure Monitor
- **Redis**: Metrics in Azure Cache for Redis dashboard

### Log Queries

```bash
# View API server logs
az containerapp logs show \
  --name api-server \
  --resource-group $RESOURCE_GROUP \
  --follow

# View container instance logs
az container logs \
  --resource-group $RESOURCE_GROUP \
  --name CONTAINER_GROUP_NAME
```

---

## 13. Cost Optimization

- **Container Apps**: Auto-scales to zero when idle (pay-per-use)
- **Container Instances**: Only pay when running (ephemeral)
- **Storage**: Pay for storage and transactions
- **Redis**: Basic tier for development, Standard for production

---

## Troubleshooting

### Container Instance Creation Fails

- Check service principal permissions
- Verify resource group exists
- Ensure image is accessible from ACR

### Blob Upload Fails

- Verify storage account name is correct
- Check container exists and has proper permissions
- Ensure DefaultAzureCredential has access

### Redis Connection Issues

- Verify Redis is running: `az redis show --name $REDIS_NAME`
- Check firewall rules
- Verify connection string format

---

With these steps complete, your Vercel-style workflow runs entirely on Azure. Use Azure Monitor to gather timing metrics for your research paper comparison.

