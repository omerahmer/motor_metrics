#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🚀 Applying Kubernetes deployments..."

echo "📊 Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

echo "⏳ Waiting for PostgreSQL to be ready..."
echo "   Note: This may take a few minutes as the EBS volume is being created..."
kubectl wait --for=condition=ready pod -l app=postgres -n motor-metrics --timeout=600s || {
    echo "⚠️  PostgreSQL not ready yet, but continuing with other deployments..."
    echo "   You can check status with: kubectl get pods -n motor-metrics"
    echo "   The pod will start once the EBS volume is provisioned"
}

echo "🌐 Deploying API and Web services..."
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml

echo ""
echo "✅ Deployments applied!"
echo ""
echo "Check status with:"
echo "  kubectl get pods -n motor-metrics"
echo "  kubectl get svc -n motor-metrics"
echo ""
echo "View logs:"
echo "  kubectl logs -f deployment/motor-metrics-api -n motor-metrics"
echo "  kubectl logs -f deployment/motor-metrics-web -n motor-metrics"

