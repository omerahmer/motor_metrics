#!/bin/bash

echo "🔍 Checking PostgreSQL status..."
echo ""

echo "📦 Pods:"
kubectl get pods -n motor-metrics -l app=postgres

echo ""
echo "💾 PVCs:"
kubectl get pvc -n motor-metrics

echo ""
echo "📋 Pod Events:"
kubectl describe pod -n motor-metrics -l app=postgres | grep -A 10 "Events:"

echo ""
echo "📝 Pod Logs (if running):"
kubectl logs -n motor-metrics -l app=postgres --tail=20 2>/dev/null || echo "Pod not running yet"

echo ""
echo "💡 If PVC is Pending, the storage class uses WaitForFirstConsumer."
echo "   The volume will be created when the pod is scheduled."
echo "   Check if there are node capacity issues:"
echo "   kubectl get nodes"
echo "   kubectl describe nodes"

