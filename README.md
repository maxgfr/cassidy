# cassidy

## Configuration

```
    mv vcap-local-example.json vcap-local.json
    npm install
    bower install
```

## Use Kubernetes

```
kubectl run wrapping-ladybug-chart-auto-848967c6d6-gcj9m --image=maxibm/ibmautomobile
kubectl get deployments
kubectl get pods
kubectl get events
kubectl config view
kubectl expose deployment wrapping-ladybug-chart-auto-848967c6d6-gcj9m --type=LoadBalancer --port=3000
kubectl get services
minikube service wrapping-ladybug-chart-auto-848967c6d6-gcj9m
```
