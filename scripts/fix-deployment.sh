#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🔧 Fixing deployment issues..."

export ECR_REPO=565944121659.dkr.ecr.us-east-1.amazonaws.com/motor-metrics
export AWS_REGION=us-east-1

echo "📦 Building and pushing images..."

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

aws ecr describe-repositories --repository-names motor-metrics-api --region $AWS_REGION >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name motor-metrics-api --region $AWS_REGION

aws ecr describe-repositories --repository-names motor-metrics-web --region $AWS_REGION >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name motor-metrics-web --region $AWS_REGION

echo "Building API image..."
docker build -f Dockerfile.api -t $ECR_REPO/motor-metrics-api:latest .
docker push $ECR_REPO/motor-metrics-api:latest

echo "Building Web image..."
docker build -f Dockerfile.web -t $ECR_REPO/motor-metrics-web:latest .
docker push $ECR_REPO/motor-metrics-web:latest

echo "✅ Images pushed successfully"

echo "🔧 Updating storage class..."
kubectl apply -f k8s/postgres-statefulset.yaml

echo "🔄 Restarting deployments..."
kubectl rollout restart deployment/motor-metrics-api -n motor-metrics
kubectl rollout restart deployment/motor-metrics-web -n motor-metrics

echo "✅ Deployment fixes applied!"
echo ""
echo "Check status with:"
echo "  kubectl get pods -n motor-metrics"
echo "  kubectl get pvc -n motor-metrics"

