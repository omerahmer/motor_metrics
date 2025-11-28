#!/bin/bash
set -e

export ECR_BASE=565944121659.dkr.ecr.us-east-1.amazonaws.com
export AWS_REGION=us-east-1

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_BASE

echo "📦 Creating ECR repositories if needed..."
aws ecr describe-repositories --repository-names motor-metrics-api --region $AWS_REGION >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name motor-metrics-api --region $AWS_REGION

aws ecr describe-repositories --repository-names motor-metrics-web --region $AWS_REGION >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name motor-metrics-web --region $AWS_REGION

API_IMAGE="$ECR_BASE/motor-metrics-api:latest"
WEB_IMAGE="$ECR_BASE/motor-metrics-web:latest"

echo "🏗️  Building API image (linux/amd64)..."
docker build --platform linux/amd64 -f Dockerfile.api -t $API_IMAGE .
echo "📤 Pushing API image..."
docker push $API_IMAGE

echo "🏗️  Building Web image (linux/amd64)..."
docker build --platform linux/amd64 -f Dockerfile.web -t $WEB_IMAGE .
echo "📤 Pushing Web image..."
docker push $WEB_IMAGE

echo ""
echo "✅ Images pushed successfully!"
echo ""
echo "Next steps:"
echo "  1. Apply the deployments: kubectl apply -f k8s/api-deployment.yaml -f k8s/web-deployment.yaml"
echo "  2. Re-apply PostgreSQL: kubectl apply -f k8s/postgres-statefulset.yaml"
echo "  3. Check status: kubectl get pods -n motor-metrics"

