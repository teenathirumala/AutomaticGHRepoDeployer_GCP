# AWS vs GCP Implementation Comparison

This document compares the AWS and GCP implementations of the Vercel Clone project.

## 📊 Architecture Comparison

| Component | AWS (`main` branch) | GCP (`gcp` branch) |
|-----------|---------------------|---------------------|
| **API Server** | EC2 Instance | Cloud Run Service |
| **Build Service** | ECS Fargate Task | Cloud Build |
| **Storage** | S3 Bucket | Cloud Storage Bucket |
| **Reverse Proxy** | EC2 Instance | Cloud Run Service |
| **Messaging** | Redis (Aiven/Valkey) | Memorystore (Redis) |
| **Container Registry** | ECR | Artifact Registry |
| **Orchestration** | ECS | Cloud Build |

## 🔧 Service Mapping

### API Server
- **AWS**: Runs on EC2, manually managed, always-on
- **GCP**: Runs on Cloud Run, serverless, auto-scales to zero

### Build Service
- **AWS**: ECS Fargate task, triggered via API, runs in container
- **GCP**: Cloud Build job, triggered via API, runs in container

### Storage
- **AWS**: S3 bucket with public read access
- **GCP**: Cloud Storage bucket with public read access

### Reverse Proxy
- **AWS**: EC2 instance running Express server
- **GCP**: Cloud Run service running Express server

## 💰 Cost Comparison

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

**Note**: Actual costs depend on usage patterns. GCP may be cheaper for low-traffic scenarios due to auto-scaling to zero.

## ⚡ Performance Comparison

### Build Time
- **AWS**: Depends on ECS task startup + build time
- **GCP**: Depends on Cloud Build worker startup + build time

### API Response Time
- **AWS**: Consistent (always-on EC2)
- **GCP**: Cold start on first request, then fast (Cloud Run)

### Storage Access
- **AWS**: S3 direct access
- **GCP**: Cloud Storage direct access
- **Both**: Similar performance for static assets

## 🛠️ Deployment Complexity

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

## 📦 Container Requirements

### AWS
- **Build Server**: 1 Dockerfile (for ECS task)
- **API/Proxy**: No Dockerfiles needed (run directly on EC2)

### GCP
- **All Services**: 3 Dockerfiles required (Cloud Run needs containers)
- **Build Server**: Additional `cloudbuild.yaml` for building the builder image

## 🔐 Security

### AWS
- IAM roles and policies
- Security groups for network access
- Secrets in Parameter Store or Secrets Manager

### GCP
- IAM roles and service accounts
- VPC firewall rules
- Secrets in Secret Manager

**Both**: Support environment variables and secret management.

## 📈 Scalability

### AWS
- Manual scaling configuration
- EC2 instances need manual scaling
- ECS can auto-scale tasks

### GCP
- Automatic scaling (Cloud Run)
- Scales to zero when idle
- Built-in load balancing

## 🎯 Use Cases

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

## 📝 Code Differences

### Key Differences:

1. **SDK Usage**:
   - AWS: `@aws-sdk/client-ecs`, `@aws-sdk/client-s3`
   - GCP: `@google-cloud/cloudbuild`, `@google-cloud/storage`

2. **Build Triggering**:
   - AWS: `ECSClient.send(RunTaskCommand)`
   - GCP: `CloudBuildClient.createBuild()`

3. **Storage Upload**:
   - AWS: `S3Client.send(PutObjectCommand)`
   - GCP: `Storage.bucket().upload()`

4. **Configuration**:
   - AWS: Hardcoded ARNs and regions (now using env vars)
   - GCP: Project-based configuration

## 🔬 For Your Research Paper

### Metrics to Compare:

1. **Build Time**:
   - Time from API request to build completion
   - Measure: ECS task duration vs Cloud Build duration

2. **API Latency**:
   - Time from request to response
   - Measure: EC2 response time vs Cloud Run (including cold starts)

3. **Storage Upload Time**:
   - Time to upload build artifacts
   - Measure: S3 upload vs Cloud Storage upload

4. **Cost per Build**:
   - Total cost for a single build
   - Measure: ECS task cost vs Cloud Build cost

5. **Scalability**:
   - Concurrent build handling
   - Measure: ECS task limits vs Cloud Build concurrency

### Measurement Approach:

Both implementations include:
- ✅ Trace IDs for distributed tracing
- ✅ Timestamp logging at each stage
- ✅ Cloud-native observability integration

Use CloudWatch (AWS) and Cloud Monitoring (GCP) to gather metrics.

---

**Note**: Switch between branches to compare implementations:
```bash
git checkout main    # AWS version
git checkout gcp     # GCP version
```

