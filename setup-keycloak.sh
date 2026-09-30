#!/bin/bash

# Configuration Keycloak
KEYCLOAK_URL="http://localhost:8085"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="keystone"
CLIENT_ID="keystone-react"
CLIENT_SECRET="keystone-secret"
REDIRECT_URI="http://localhost:3001/*"

# Attendre que Keycloak soit prêt
echo "Attente de Keycloak..."
until curl -s -f "$KEYCLOAK_URL/health/ready" > /dev/null; do
    sleep 2
done
echo "Keycloak est prêt!"

# Obtenir le token admin
echo "Obtention du token admin..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
    echo "Erreur: Impossible d'obtenir le token admin"
    exit 1
fi

echo "Token admin obtenu avec succès"

# Créer le realm Keystone
echo "Création du realm $REALM_NAME..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'$REALM_NAME'",
    "enabled": true,
    "displayName": "Keystone Enterprise",
    "sslRequired": "external"
  }'

echo "Realm $REALM_NAME créé"

# Créer le client React
echo "Création du client $CLIENT_ID..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'$CLIENT_ID'",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "secret": "'$CLIENT_SECRET'",
    "redirectUris": ["'$REDIRECT_URI'"],
    "webOrigins": ["http://localhost:3001"],
    "protocol": "openid-connect",
    "publicClient": false,
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": true,
    "attributes": {
      "access.token.lifespan": "3600"
    }
  }'

echo "Client $CLIENT_ID créé"

# Créer les rôles
echo "Création des rôles..."
for role in "admin" "manager" "employee"; do
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "'$role'",
        "description": "Role '$role' for Keystone application"
      }'
    echo "Rôle $role créé"
done

# Créer un utilisateur admin par défaut
echo "Création de l utilisateur admin par défaut..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "enabled": true,
    "emailVerified": true,
    "email": "admin@keystone.com",
    "firstName": "Admin",
    "lastName": "User",
    "credentials": [
      {
        "type": "password",
        "value": "admin123",
        "temporary": false
      }
    ]
  }'

# Assigner le rôle admin à l'utilisateur
echo "Assignation du rôle admin à l utilisateur..."
USER_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=admin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

ROLE_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/admin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')

curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$USER_ID/role-mappings/realm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[{\"id\": \"$ROLE_ID\", \"name\": \"admin\"}]"

echo "Configuration Keycloak terminée avec succès!"
echo "=============================================="
echo "URL Keycloak: $KEYCLOAK_URL"
echo "Realm: $REALM_NAME"
echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"
echo "Utilisateur par défaut: admin / admin123"
echo "=============================================="
