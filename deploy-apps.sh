#!/bin/bash
set -e

echo "🚀 Deploying API and Web services..."

# Check if images exist in ECR
export ECR_BASE=565944121659.dkr.ecr.us-east-1.amazonaws.com
export AWS_REGION=us-east-1

echo "🔍 Checking if images exist in ECR..."
if ! aws ecr describe-images --repository-name motor-metrics-api --region $AWS_REGION --image-ids imageTag=latest >/dev/null 2>&1; then
    echo "❌ API image not found in ECR. Please run ./deploy-images.sh first"
    exit 1
fi

if ! aws ecr describe-images --repository-name motor-metrics-web --region $AWS_REGION --image-ids imageTag=latest >/dev/null 2>&1; then
    echo "❌ Web image not found in ECR. Please run ./deploy-images.sh first"
    exit 1
fi

echo "✅ Images found in ECR"

# Apply deployments
echo "📦 Applying API deployment..."
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml

echo "🌐 Applying Web deployment..."
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml

echo "📊 Applying Ingress and HPA..."
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

echo ""
echo "✅ All services deployed!"
echo ""
echo "⏳ Waiting for pods to be ready..."
sleep 5

kubectl get pods -n motor-metrics

echo ""
echo "📝 To check logs:"
echo "  kubectl logs -f deployment/motor-metrics-api -n motor-metrics"
echo "  kubectl logs -f deployment/motor-metrics-web -n motor-metrics"
echo ""
echo "🌐 To access the application:"
echo "  kubectl port-forward svc/motor-metrics-web -n motor-metrics 3000:80"

