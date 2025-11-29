#!/bin/bash
set -e

cd "$(dirname "$0")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ECR_BASE="${ECR_BASE:-565944121659.dkr.ecr.us-east-1.amazonaws.com}"
REGION="${AWS_REGION:-us-east-1}"
NAMESPACE="motor-metrics"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-changeme}"
MARKETCHECK_API_KEY="${MARKETCHECK_API_KEY:KdNXRc9F0R9SrCJahMsP2qNhC5iRqMtk}"

echo -e "${GREEN}Motor Metrics Deployment Script${NC}"
echo "=================================="

command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: docker is required${NC}" >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}Error: kubectl is required${NC}" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}Error: aws cli is required${NC}" >&2; exit 1; }

echo -e "${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_BASE

echo -e "${YELLOW}Creating ECR repositories if needed...${NC}"
aws ecr describe-repositories --repository-names motor-metrics-api --region $REGION >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name motor-metrics-api --region $REGION

aws ecr describe-repositories --repository-names motor-metrics-web --region $REGION >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name motor-metrics-web --region $REGION

API_IMAGE="$ECR_BASE/motor-metrics-api:latest"
WEB_IMAGE="$ECR_BASE/motor-metrics-web:latest"

echo -e "${YELLOW}Building API image (linux/amd64)...${NC}"
docker build --platform linux/amd64 -f Dockerfile.api -t $API_IMAGE .
docker tag $API_IMAGE $ECR_BASE/motor-metrics-api:$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

echo -e "${YELLOW}Pushing API image...${NC}"
docker push $API_IMAGE
docker push $ECR_BASE/motor-metrics-api:$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

echo -e "${YELLOW}Building Web image (linux/amd64)...${NC}"
docker build --platform linux/amd64 -f Dockerfile.web -t $WEB_IMAGE .
docker tag $WEB_IMAGE $ECR_BASE/motor-metrics-web:$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

echo -e "${YELLOW}Pushing Web image...${NC}"
docker push $WEB_IMAGE
docker push $ECR_BASE/motor-metrics-web:$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

echo -e "${YELLOW}Updating deployment files...${NC}"
sed -i.bak "s|565944121659.dkr.ecr.us-east-1.amazonaws.com/motor-metrics/motor-metrics-api:latest|$API_IMAGE|g" k8s/api-deployment.yaml
sed -i.bak "s|motor-metrics-api:latest|$API_IMAGE|g" k8s/api-deployment.yaml
sed -i.bak "s|565944121659.dkr.ecr.us-east-1.amazonaws.com/motor-metrics/motor-metrics-web:latest|$WEB_IMAGE|g" k8s/web-deployment.yaml
sed -i.bak "s|motor-metrics-web:latest|$WEB_IMAGE|g" k8s/web-deployment.yaml

echo -e "${YELLOW}Applying Kubernetes manifests...${NC}"
kubectl apply -f k8s/namespace.yaml

echo -e "${YELLOW}Deploying PostgreSQL...${NC}"
kubectl create secret generic postgres-secret \
    --from-literal=POSTGRES_PASSWORD="$DATABASE_PASSWORD" \
    --namespace=$NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s || {
    echo -e "${RED}PostgreSQL failed to start. Check logs with: kubectl logs -f statefulset/postgres -n $NAMESPACE${NC}"
    exit 1
}

if [ -z "$MARKETCHECK_API_KEY" ]; then
    echo -e "${YELLOW}MARKETCHECK_API_KEY not set. Please enter it:${NC}"
    read -sp "Enter MARKETCHECK_API_KEY: " MARKETCHECK_API_KEY
    echo
fi

kubectl create secret generic motor-metrics-secrets \
    --from-literal=MARKETCHECK_API_KEY="$MARKETCHECK_API_KEY" \
    --from-literal=DATABASE_PASSWORD="$DATABASE_PASSWORD" \
    --namespace=$NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

echo -e "${YELLOW}Deploying application services...${NC}"
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

mv k8s/api-deployment.yaml.bak k8s/api-deployment.yaml 2>/dev/null || true
mv k8s/web-deployment.yaml.bak k8s/web-deployment.yaml 2>/dev/null || true

echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Check status with:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get svc -n $NAMESPACE"
echo "  kubectl get ingress -n $NAMESPACE"
echo ""
echo "Access the application:"
echo "  kubectl port-forward svc/motor-metrics-web -n $NAMESPACE 3000:80"
echo "  kubectl port-forward svc/motor-metrics-api -n $NAMESPACE 8080:80"
echo ""
echo "  Then open http://localhost:3000 in your browser"
echo ""
echo "View logs:"
echo "  kubectl logs -f deployment/motor-metrics-api -n $NAMESPACE"
echo "  kubectl logs -f deployment/motor-metrics-web -n $NAMESPACE"
echo "  kubectl logs -f statefulset/postgres -n $NAMESPACE"

