# cassidy

## Configuration

```
    mv vcap-local-example.json vcap-local.json
    npm install
    bower install
```

## Use Kubernetes

```
kubectl run wrapping-ladybug-chart-auto-848967c6d6-gcj9m --image=maxibm/cassidy
kubectl get deployments
kubectl get pods
kubectl get events
kubectl config view
kubectl expose deployment wrapping-ladybug-chart-auto-848967c6d6-gcj9m --type=LoadBalancer --port=3000
kubectl get services
minikube service wrapping-ladybug-chart-auto-848967c6d6-gcj9m
```

## Push on cloud

```
ibmcloud login --sso
ibmcloud target --cf
ibmcloud cf push
```

## Models - Decision Table ODM

```
curl \
  -H "Content-Type: application/json" \
  -H "Authorization: ApiKey $MY_DCOMP_API_KEY" \
  -d '{"modele":"ACTIVE","couleur":"AUTRE","usage":"EXTRA","energy":"ESSENCE","bv":"AUTOMATIQUE","confort":"MOYEN","esthet":"MOYEN","media":"MOYEN","assistance":"MOYEN"}' \
  "https://decision-composer.ibm.com/rest/public/v1/execution/5beed4ad2846520012a1114b/execute/v19"
```

## Options - Rules ODM

```
curl \
  -H "Content-Type: application/json" \
  -H "Authorization: ApiKey $MY_DCOMP_API_KEY" \
  -d '{"modele":"ACTIVE"}' \
  "https://decision-composer.ibm.com/rest/public/v1/execution/5bfc13942846520012a113d5/execute/v14"
```
