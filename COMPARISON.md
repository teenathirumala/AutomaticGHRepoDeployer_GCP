# AWS vs GCP vs Azure Implementation Comparison

This document compares the AWS, GCP, and Azure implementations of the Vercel Clone project.

##  Architecture Comparison

| Component | AWS (`main` branch) | GCP (`gcp` branch) | Azure (`azure` branch) |
|-----------|---------------------|---------------------|------------------------|
| **API Server** | EC2 Instance | Cloud Run Service | Container Apps |
| **Build Service** | ECS Fargate Task | Cloud Build | Container Instances |
| **Storage** | S3 Bucket | Cloud Storage Bucket | Blob Storage |
| **Reverse Proxy** | EC2 Instance | Cloud Run Service | Container Apps |
| **Messaging** | Redis (Aiven/Valkey) | Memorystore (Redis) | Azure Cache for Redis |
| **Container Registry** | ECR | Artifact Registry | Azure Container Registry |
| **Orchestration** | ECS | Cloud Build | Container Instances API |

##  Service Mapping

### API Server
- **AWS**: Runs on EC2, manually managed, always-on
- **GCP**: Runs on Cloud Run, serverless, auto-scales to zero
- **Azure**: Runs on Container Apps, serverless, auto-scales to zero

### Build Service
- **AWS**: ECS Fargate task, triggered via API, runs in container
- **GCP**: Cloud Build job, triggered via API, runs in container
- **Azure**: Container Instance, triggered via API, runs in container

### Storage
- **AWS**: S3 bucket with public read access
- **GCP**: Cloud Storage bucket with public read access
- **Azure**: Blob Storage container with public read access

### Reverse Proxy
- **AWS**: EC2 instance running Express server
- **GCP**: Cloud Run service running Express server
- **Azure**: Container Apps service running Express server

##  Cost Comparison

### AWS
- **EC2**: Pay for running instances (even when idle)
- **ECS Fargate**: Pay per task execution time
- **S3**: Pay for storage and requests
- **Always-on costs**: EC2 instances run 24/7

### GCP
- **Cloud Run**: Pay only for request processing time
- **Cloud Build**: Pay per build minute
- **Cloud Storage**: Pay for storage and requests
- **Auto-scaling to zero**: No cost when idle

### Azure
- **Container Apps**: Pay only for request processing time
- **Container Instances**: Pay per second while running
- **Blob Storage**: Pay for storage and requests
- **Auto-scaling to zero**: No cost when idle

**Note**: Actual costs depend on usage patterns. GCP and Azure may be cheaper for low-traffic scenarios due to auto-scaling to zero.

##  Performance Comparison

### Build Time
- **AWS**: Depends on ECS task startup + build time
- **GCP**: Depends on Cloud Build worker startup + build time
- **Azure**: Depends on Container Instance startup + build time

### API Response Time
- **AWS**: Consistent (always-on EC2)
- **GCP**: Cold start on first request, then fast (Cloud Run)
- **Azure**: Cold start on first request, then fast (Container Apps)

### Storage Access
- **AWS**: S3 direct access
- **GCP**: Cloud Storage direct access
- **Azure**: Blob Storage direct access
- **All**: Similar performance for static assets

##  Deployment Complexity

### AWS
- ✅ More control over infrastructure
- ❌ More manual setup (EC2, security groups, etc.)
- ❌ Need to manage scaling manually
- ❌ Always-on costs

### GCP
- ✅ Simpler deployment (Cloud Run handles infrastructure)
- ✅ Auto-scaling built-in
- ✅ Pay-per-use pricing
- ❌ Less control over underlying infrastructure

### Azure
- ✅ Simpler deployment (Container Apps handles infrastructure)
- ✅ Auto-scaling built-in
- ✅ Pay-per-use pricing
- ✅ Managed Identity for authentication
- ❌ Less control over underlying infrastructure

##  Container Requirements

### AWS
- **Build Server**: 1 Dockerfile (for ECS task)
- **API/Proxy**: No Dockerfiles needed (run directly on EC2)

### GCP
- **All Services**: 3 Dockerfiles required (Cloud Run needs containers)
- **Build Server**: Additional `cloudbuild.yaml` for building the builder image

### Azure
- **All Services**: 3 Dockerfiles required (Container Apps needs containers)
- **Build Server**: Uses ACR build or Azure DevOps Pipelines

##  Security

### AWS
- IAM roles and policies
- Security groups for network access
- Secrets in Parameter Store or Secrets Manager

### GCP
- IAM roles and service accounts
- VPC firewall rules
- Secrets in Secret Manager

### Azure
- Managed Identity (recommended) or Service Principals
- Network security groups
- Secrets in Key Vault

**All**: Support environment variables and secret management.

## Scalability

### AWS
- Manual scaling configuration
- EC2 instances need manual scaling
- ECS can auto-scale tasks

### GCP
- Automatic scaling (Cloud Run)
- Scales to zero when idle
- Built-in load balancing

### Azure
- Automatic scaling (Container Apps)
- Scales to zero when idle
- Built-in load balancing

## Use Cases

### Choose AWS if:
- You need fine-grained control over infrastructure
- You have existing AWS infrastructure
- You prefer EC2/VPC networking model
- You need always-on services

### Choose GCP if:
- You want serverless, auto-scaling services
- You prefer pay-per-use pricing
- You want simpler deployment
- You need cost optimization for variable traffic

### Choose Azure if:
- You want serverless, auto-scaling services
- You have existing Azure infrastructure
- You prefer Microsoft ecosystem integration
- You need Managed Identity for authentication
- You want pay-per-use pricing

##  Code Differences

### Key Differences:

1. **SDK Usage**:
   - AWS: `@aws-sdk/client-ecs`, `@aws-sdk/client-s3`
   - GCP: `@google-cloud/cloudbuild`, `@google-cloud/storage`
   - Azure: `@azure/arm-containerinstance`, `@azure/storage-blob`, `@azure/identity`

2. **Build Triggering**:
   - AWS: `ECSClient.send(RunTaskCommand)`
   - GCP: `CloudBuildClient.createBuild()`
   - Azure: `ContainerInstanceManagementClient.containerGroups.beginCreateOrUpdateAndWait()`

3. **Storage Upload**:
   - AWS: `S3Client.send(PutObjectCommand)`
   - GCP: `Storage.bucket().upload()`
   - Azure: `BlobServiceClient.getContainerClient().getBlockBlobClient().uploadFile()`

4. **Authentication**:
   - AWS: Access keys or IAM roles
   - GCP: Service account keys or Workload Identity
   - Azure: Managed Identity (DefaultAzureCredential) or Service Principal

5. **Configuration**:
   - AWS: ARNs and regions (using env vars)
   - GCP: Project-based configuration
   - Azure: Subscription and resource group based

##  For Your Research Paper

### Metrics to Compare:

1. **Build Time**:
   - Time from API request to build completion
   - Measure: ECS task duration vs Cloud Build duration vs Container Instance duration

2. **API Latency**:
   - Time from request to response
   - Measure: EC2 response time vs Cloud Run vs Container Apps (including cold starts)

3. **Storage Upload Time**:
   - Time to upload build artifacts
   - Measure: S3 upload vs Cloud Storage upload vs Blob Storage upload

4. **Cost per Build**:
   - Total cost for a single build
   - Measure: ECS task cost vs Cloud Build cost vs Container Instance cost


### Measurement Approach:


Use:
- **AWS**: CloudWatch for metrics
- **GCP**: Cloud Monitoring for metrics
- **Azure**: Azure Monitor for metrics

---

**Note**: Switch between branches to compare implementations:
```bash
git checkout main    # AWS version
git checkout gcp     # GCP version
git checkout azure   # Azure version
```

