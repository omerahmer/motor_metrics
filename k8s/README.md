# Kubernetes Deployment Guide for Motor Metrics

This directory contains Kubernetes manifests for deploying Motor Metrics on Amazon EKS.

## Prerequisites

1. **EKS Cluster**: An AWS EKS cluster must be created and configured
2. **kubectl**: Configured to connect to your EKS cluster
3. **AWS CLI**: Configured with appropriate credentials
4. **Docker**: For building container images
5. **ECR Access**: Push images to Amazon ECR (or use another container registry)

## Architecture

- **API Service**: Go-based API server with caching and rate limiting
- **Web Service**: Next.js frontend
- **Horizontal Pod Autoscaling**: Automatic scaling based on CPU/memory
- **Ingress**: ALB Ingress Controller for AWS load balancing

## Deployment Steps

### 1. Build and Push Docker Images

```bash
# Set your ECR repository URL
export ECR_REPO=123456789012.dkr.ecr.us-west-2.amazonaws.com

# Build and push API image
docker build -f Dockerfile.api -t $ECR_REPO/motor-metrics-api:latest .
docker push $ECR_REPO/motor-metrics-api:latest

# Build and push Web image
docker build -f Dockerfile.web -t $ECR_REPO/motor-metrics-web:latest .
docker push $ECR_REPO/motor-metrics-web:latest
```

### 2. Update Image References

Update the image names in:
- `api-deployment.yaml`
- `web-deployment.yaml`

Replace `motor-metrics-api:latest` and `motor-metrics-web:latest` with your ECR image URLs.

### 3. Create Secrets

```bash
# Create the secret with your API key and database password
kubectl create secret generic motor-metrics-secrets \
  --from-literal=MARKETCHECK_API_KEY='your-api-key-here' \
  --from-literal=DATABASE_PASSWORD='your-db-password' \
  --namespace=motor-metrics \
  --dry-run=client -o yaml | kubectl apply -f -

# Also update postgres-secret to match
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD='your-db-password' \
  --namespace=motor-metrics \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 4. Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f namespace.yaml

# Deploy PostgreSQL first
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f postgres-service.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n motor-metrics --timeout=300s

# Deploy application
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml
kubectl apply -f web-deployment.yaml
kubectl apply -f web-service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n motor-metrics

# Check services
kubectl get svc -n motor-metrics

# Check ingress
kubectl get ingress -n motor-metrics

# View logs
kubectl logs -f deployment/motor-metrics-api -n motor-metrics
kubectl logs -f deployment/motor-metrics-web -n motor-metrics
```

## Configuration

### Environment Variables

Edit `configmap.yaml` to customize:
- `MARKETCHECK_BASE_URL`: MarketCheck API base URL
- `KAFKA_BROKERS`: Kafka broker addresses
- `SEARCH_MAKE`, `SEARCH_MODEL`, `SEARCH_ZIP`, `SEARCH_RADIUS`: Default search parameters

### Scaling

Edit `hpa.yaml` to adjust:
- `minReplicas`: Minimum number of pods
- `maxReplicas`: Maximum number of pods
- Resource utilization targets

### Resources

Edit deployment files to adjust:
- CPU and memory requests/limits
- Number of replicas

## Ingress Configuration

The ingress uses AWS ALB Ingress Controller. Update `ingress.yaml`:
- Change `motor-metrics.example.com` to your domain
- Configure SSL certificate if using HTTPS
- Adjust annotations for your ALB setup

## Monitoring

### Health Checks

- API: `http://<service>/health` and `/ready`
- Web: `http://<service>/`

### Metrics

Consider adding:
- Prometheus for metrics collection
- Grafana for visualization
- CloudWatch integration for AWS-native monitoring

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n motor-metrics

# Check logs
kubectl logs <pod-name> -n motor-metrics
```

### API Connection Issues

- Verify secrets are correctly set
- Check ConfigMap values
- Ensure network policies allow traffic

### Image Pull Errors

- Verify ECR authentication: `aws ecr get-login-password | docker login --username AWS --password-stdin <ECR_URL>`
- Check image pull policy in deployments

## Cleanup

```bash
# Delete all resources
kubectl delete namespace motor-metrics
```

