# Docker Image Building Instructions

This document provides step-by-step instructions for DevOps engineers to build and deploy the Docker image for the TOUR application.

## Prerequisites

Before building the Docker image, ensure you have the following installed:

- **Docker** (version 20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (optional, for multi-container setups)
- **Git** (to clone the repository)
- A terminal/command prompt with Docker access

## Quick Start

### 1. Clone or Pull the Repository

```bash
git clone <repository-url>
cd tour
```

### 2. Build the Docker Image

Build the image with a descriptive tag:

```bash
docker build -t tour-app:latest .
```

**Alternative tags for versioning:**

```bash
docker build -t tour-app:v1.0.0 .
docker build -t tour-app:staging .
docker build -t myregistry.azurecr.io/tour-app:latest .  # For Azure Container Registry
docker build -t gcr.io/my-project/tour-app:latest .     # For Google Container Registry
```

### 3. Verify the Build

Check if the image was created successfully:

```bash
docker images | grep tour-app
```

You should see output similar to:

```
tour-app     latest     abc123def456    5 minutes ago    450MB
```

## Running the Container

### Basic Execution

```bash
docker run -p 8080:8080 tour-app:latest
```

The application will be available at `http://localhost:8080`

### With Environment Variables

```bash
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  tour-app:latest
```

### Detached Mode (Background)

```bash
docker run -d \
  -p 8080:8080 \
  --name tour-container \
  tour-app:latest
```

View logs:

```bash
docker logs tour-container
docker logs -f tour-container  # Follow logs in real-time
```

## Container Management

### List Running Containers

```bash
docker ps
```

### Stop Container

```bash
docker stop tour-container
```

### Remove Container

```bash
docker rm tour-container
```

### View Container Logs

```bash
docker logs tour-container
docker logs --tail 100 tour-container  # Last 100 lines
```

### Execute Command in Running Container

```bash
docker exec -it tour-container /bin/sh
```

## Multi-Stage Build Benefits

The Dockerfile uses a **multi-stage build** to optimize image size:

- **Build Stage**: Installs all dependencies (dev + prod) and builds the application
- **Production Stage**: Only copies production dependencies and built files

**Result**: Final image size is ~450MB instead of ~900MB

## Image Size Optimization

### View Image Layers

```bash
docker history tour-app:latest
```

### Reduce Image Size Further

If you need a smaller image, use `node:20-slim` instead of `node:20-alpine`:

```dockerfile
FROM node:20-slim AS builder
# ... rest of Dockerfile
```

## Pushing to Container Registry

### Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag the image
docker tag tour-app:latest yourusername/tour-app:latest

# Push the image
docker push yourusername/tour-app:latest
```

### Azure Container Registry (ACR)

```bash
# Login to ACR
az acr login --name myregistry

# Tag the image
docker tag tour-app:latest myregistry.azurecr.io/tour-app:latest

# Push the image
docker push myregistry.azurecr.io/tour-app:latest
```

### Google Container Registry (GCR)

```bash
# Configure authentication
gcloud auth configure-docker

# Tag the image
docker tag tour-app:latest gcr.io/my-project/tour-app:latest

# Push the image
docker push gcr.io/my-project/tour-app:latest
```

### AWS Elastic Container Registry (ECR)

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag the image
docker tag tour-app:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/tour-app:latest

# Push the image
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/tour-app:latest
```

## Kubernetes Deployment

### Create Kubernetes Manifests

**deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tour-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tour-app
  template:
    metadata:
      labels:
        app: tour-app
    spec:
      containers:
      - name: tour-app
        image: tour-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
```

**service.yaml:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: tour-app-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: tour-app
```

### Deploy to Kubernetes

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

## Docker Compose (Multi-Container Setup)

Create a `docker-compose.yml` if you need additional services (database, redis, etc.):

```yaml
version: '3.8'

services:
  tour-app:
    build: .
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Run with Docker Compose:

```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

## Troubleshooting

### Build Fails with "pnpm-lock.yaml" Not Found

Ensure you have the `pnpm-lock.yaml` file in your repository. If it's missing:

```bash
pnpm install
```

Then commit it to the repository.

### Container Exits Immediately

Check the logs:

```bash
docker logs tour-container
```

Common issues:
- Missing environment variables
- Incorrect port configuration
- Node.js startup errors

### Port Already in Use

If port 8080 is already in use, map to a different port:

```bash
docker run -p 3000:8080 tour-app:latest
```

Access the app at `http://localhost:3000`

### High Memory Usage

Monitor container resource usage:

```bash
docker stats tour-container
```

Limit memory:

```bash
docker run -p 8080:8080 -m 1g --memory-swap 1g tour-app:latest
```

## Security Best Practices

### Run Container as Non-Root User

Update the Dockerfile:

```dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### Scan Image for Vulnerabilities

```bash
docker scan tour-app:latest
```

### Use Specific Base Image Versions

Avoid `latest` tag:

```dockerfile
FROM node:20.10-alpine
```

## Performance Monitoring

### Set Resource Limits

```bash
docker run -p 8080:8080 \
  -m 1g \
  --cpus="2.0" \
  tour-app:latest
```

### Monitor Running Container

```bash
docker stats tour-container
```

## Cleanup

### Remove Unused Images

```bash
docker image prune
```

### Remove All Stopped Containers

```bash
docker container prune
```

### Full Cleanup (Be Careful!)

```bash
docker system prune -a
```

## Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/README.md)

## Support

For issues or questions about this Docker setup, contact the development team or refer to the project's main README.

---

**Last Updated**: 2024  
**Dockerfile Location**: `./Dockerfile`  
**Application Port**: 8080
