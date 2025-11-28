# Quick Start Deployment

The fastest way to get everything running.

## Prerequisites Check

```bash
# Verify kubectl is configured
kubectl cluster-info

# Verify AWS CLI is configured
aws sts get-caller-identity

# Verify Docker is running
docker ps
```

## One-Command Deploy

```bash
# Set your values
export ECR_REPO=your-ecr-repo.dkr.ecr.region.amazonaws.com
export AWS_REGION=us-west-2
export DATABASE_PASSWORD=your-secure-password
export MARKETCHECK_API_KEY=your-api-key

# Run deployment
./deploy.sh
```

## What Gets Deployed

1. ✅ **PostgreSQL** - StatefulSet with persistent storage
2. ✅ **API Service** - Go API with caching and rate limiting
3. ✅ **Web Service** - Next.js frontend
4. ✅ **Ingress** - ALB for external access
5. ✅ **HPA** - Auto-scaling

## Verify Everything is Running

```bash
# Check all pods
kubectl get pods -n motor-metrics

# Should see:
# - postgres-0 (Running)
# - motor-metrics-api-xxx (Running)
# - motor-metrics-web-xxx (Running)
```

## Access the Application

### Option 1: Port Forward (Quick Test)

```bash
# Terminal 1: Web
kubectl port-forward svc/motor-metrics-web -n motor-metrics 3000:80

# Terminal 2: API (if needed)
kubectl port-forward svc/motor-metrics-api -n motor-metrics 8080:80
```

Open http://localhost:3000 in your browser.

### Option 2: Ingress (Production)

Update the hostname in `k8s/ingress.yaml` and access via your domain.

## Common Issues

### PostgreSQL Not Ready

```bash
# Check PostgreSQL logs
kubectl logs -f statefulset/postgres -n motor-metrics

# Check if PVC was created
kubectl get pvc -n motor-metrics
```

### API Can't Connect to Database

```bash
# Check API logs
kubectl logs -f deployment/motor-metrics-api -n motor-metrics

# Verify database connection string
kubectl exec deployment/motor-metrics-api -n motor-metrics -- env | grep DATABASE
```

### Images Not Found

```bash
# Verify images were pushed
aws ecr describe-images --repository-name motor-metrics-api --region $AWS_REGION

# Re-authenticate if needed
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPO
```

## Next Steps

1. **Set up monitoring** - Add Prometheus/Grafana
2. **Configure backups** - Set up PostgreSQL backups
3. **Add SSL** - Configure TLS for ingress
4. **Scale up** - Adjust HPA limits based on load

For detailed information, see [DEPLOYMENT.md](DEPLOYMENT.md).

