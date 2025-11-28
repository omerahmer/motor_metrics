#!/bin/bash
set -e

echo "🔧 Fixing deployment issues..."

# 1. First, let's build and push the images
export ECR_REPO=565944121659.dkr.ecr.us-east-1.amazonaws.com/motor-metrics
export AWS_REGION=us-east-1

echo "📦 Building and pushing images..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Create repositories if they don't exist
aws ecr describe-repositories --repository-names motor-metrics-api --region $AWS_REGION >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name motor-metrics-api --region $AWS_REGION

aws ecr describe-repositories --repository-names motor-metrics-web --region $AWS_REGION >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name motor-metrics-web --region $AWS_REGION

# Build and push API
echo "Building API image..."
docker build -f Dockerfile.api -t $ECR_REPO/motor-metrics-api:latest .
docker push $ECR_REPO/motor-metrics-api:latest

# Build and push Web
echo "Building Web image..."
docker build -f Dockerfile.web -t $ECR_REPO/motor-metrics-web:latest .
docker push $ECR_REPO/motor-metrics-web:latest

echo "✅ Images pushed successfully"

# 2. Fix storage class
echo "🔧 Updating storage class..."
kubectl apply -f k8s/postgres-statefulset.yaml

# 3. Restart deployments to pull new images
echo "🔄 Restarting deployments..."
kubectl rollout restart deployment/motor-metrics-api -n motor-metrics
kubectl rollout restart deployment/motor-metrics-web -n motor-metrics

echo "✅ Deployment fixes applied!"
echo ""
echo "Check status with:"
echo "  kubectl get pods -n motor-metrics"
echo "  kubectl get pvc -n motor-metrics"

