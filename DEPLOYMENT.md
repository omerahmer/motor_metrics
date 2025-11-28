# Complete Deployment Guide

This guide walks you through deploying the entire Motor Metrics application on Kubernetes (EKS).

## Prerequisites

1. **AWS EKS Cluster** - Running and accessible
2. **kubectl** - Configured to connect to your cluster
3. **AWS CLI** - Configured with credentials
4. **Docker** - For building images
5. **ECR Repository** - For storing Docker images (or use another registry)

## Step 1: Prepare Environment Variables

Create a `.env.deploy` file with your values:

```bash
export ECR_REPO=123456789012.dkr.ecr.us-west-2.amazonaws.com
export AWS_REGION=us-west-2
export MARKETCHECK_API_KEY=your-api-key-here
export DATABASE_PASSWORD=your-secure-password-here
```

## Step 2: Build and Push Docker Images

```bash
# Source your environment
source .env.deploy

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPO

# Build and push API image
docker build -f Dockerfile.api -t $ECR_REPO/motor-metrics-api:latest .
docker push $ECR_REPO/motor-metrics-api:latest

# Build and push Web image
docker build -f Dockerfile.web -t $ECR_REPO/motor-metrics-web:latest .
docker push $ECR_REPO/motor-metrics-web:latest
```

## Step 3: Update Kubernetes Manifests

Update the image references in the deployment files:

```bash
# Update API deployment
sed -i.bak "s|motor-metrics-api:latest|$ECR_REPO/motor-metrics-api:latest|g" k8s/api-deployment.yaml

# Update Web deployment
sed -i.bak "s|motor-metrics-web:latest|$ECR_REPO/motor-metrics-web:latest|g" k8s/web-deployment.yaml
```

## Step 4: Deploy to Kubernetes

### 4.1 Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 4.2 Deploy PostgreSQL

```bash
# Update postgres password in secret
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD="$DATABASE_PASSWORD" \
  --namespace=motor-metrics \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# Wait for PostgreSQL to be ready (this may take 1-2 minutes)
kubectl wait --for=condition=ready pod -l app=postgres -n motor-metrics --timeout=300s

# Verify PostgreSQL is running
kubectl get pods -n motor-metrics -l app=postgres
```

### 4.3 Create Application Secrets

```bash
kubectl create secret generic motor-metrics-secrets \
  --from-literal=MARKETCHECK_API_KEY="$MARKETCHECK_API_KEY" \
  --from-literal=DATABASE_PASSWORD="$DATABASE_PASSWORD" \
  --namespace=motor-metrics \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 4.4 Deploy Application Services

```bash
# Deploy ConfigMap
kubectl apply -f k8s/configmap.yaml

# Deploy API
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml

# Deploy Web
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml

# Deploy Ingress (optional, for external access)
kubectl apply -f k8s/ingress.yaml

# Deploy HPA for auto-scaling
kubectl apply -f k8s/hpa.yaml
```

### 4.5 Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n motor-metrics

# Check services
kubectl get svc -n motor-metrics

# Check ingress (if deployed)
kubectl get ingress -n motor-metrics

# View API logs
kubectl logs -f deployment/motor-metrics-api -n motor-metrics

# View Web logs
kubectl logs -f deployment/motor-metrics-web -n motor-metrics

# View PostgreSQL logs
kubectl logs -f statefulset/postgres -n motor-metrics
```

## Step 5: Access the Application

### Option 1: Port Forward (for testing)

```bash
# Forward API port
kubectl port-forward svc/motor-metrics-api -n motor-metrics 8080:80

# Forward Web port
kubectl port-forward svc/motor-metrics-web -n motor-metrics 3000:80
```

Then access:
- Web UI: http://localhost:3000
- API: http://localhost:8080/api/search

### Option 2: Ingress (for production)

If you deployed ingress, update the hostname in `k8s/ingress.yaml` and access via your domain.

## Step 6: Verify Database Connection

```bash
# Connect to PostgreSQL pod
kubectl exec -it postgres-0 -n motor-metrics -- psql -U postgres -d motor_metrics

# Check tables
\dt

# Check listings count
SELECT COUNT(*) FROM listings;

# Check price history count
SELECT COUNT(*) FROM price_history;

# Exit
\q
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n motor-metrics

# Check events
kubectl get events -n motor-metrics --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
kubectl get pods -n motor-metrics -l app=postgres

# Test connection from API pod
kubectl exec -it deployment/motor-metrics-api -n motor-metrics -- \
  sh -c 'echo "SELECT 1;" | psql $DATABASE_URL'
```

### Image Pull Errors

```bash
# Verify ECR authentication
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPO

# Check image exists
aws ecr describe-images --repository-name motor-metrics-api --region $AWS_REGION
```

### Check Logs

```bash
# API logs
kubectl logs -f deployment/motor-metrics-api -n motor-metrics

# Web logs
kubectl logs -f deployment/motor-metrics-web -n motor-metrics

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n motor-metrics
```

## Quick Deploy Script

Save this as `deploy-all.sh`:

```bash
#!/bin/bash
set -e

source .env.deploy

echo "Building and pushing images..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPO

docker build -f Dockerfile.api -t $ECR_REPO/motor-metrics-api:latest .
docker push $ECR_REPO/motor-metrics-api:latest

docker build -f Dockerfile.web -t $ECR_REPO/motor-metrics-web:latest .
docker push $ECR_REPO/motor-metrics-web:latest

echo "Updating manifests..."
sed -i.bak "s|motor-metrics-api:latest|$ECR_REPO/motor-metrics-api:latest|g" k8s/api-deployment.yaml
sed -i.bak "s|motor-metrics-web:latest|$ECR_REPO/motor-metrics-web:latest|g" k8s/web-deployment.yaml

echo "Deploying to Kubernetes..."
kubectl apply -f k8s/namespace.yaml

kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD="$DATABASE_PASSWORD" \
  --namespace=motor-metrics \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

echo "Waiting for PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n motor-metrics --timeout=300s

kubectl create secret generic motor-metrics-secrets \
  --from-literal=MARKETCHECK_API_KEY="$MARKETCHECK_API_KEY" \
  --from-literal=DATABASE_PASSWORD="$DATABASE_PASSWORD" \
  --namespace=motor-metrics \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

echo "Deployment complete!"
kubectl get pods -n motor-metrics
```

Make it executable and run:
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

## Production Considerations

1. **Database Backups**: Set up regular backups of PostgreSQL
2. **Monitoring**: Add Prometheus/Grafana for metrics
3. **Logging**: Consider centralized logging (CloudWatch, ELK)
4. **SSL/TLS**: Configure SSL for database connections in production
5. **Resource Limits**: Adjust based on your workload
6. **Secrets Management**: Use AWS Secrets Manager or similar
7. **Network Policies**: Add network policies for security
8. **Ingress TLS**: Configure SSL certificates for ingress

## Cleanup

To remove everything:

```bash
kubectl delete namespace motor-metrics
```

Note: This will delete all data including the PostgreSQL persistent volume!

