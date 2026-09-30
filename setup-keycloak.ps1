# Configuration Keycloak
$KEYCLOAK_URL = "http://localhost:8085"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "admin"
$REALM_NAME = "keystone"
$CLIENT_ID = "keystone-react"
$CLIENT_SECRET = "keystone-secret"
$REDIRECT_URI = "http://localhost:3001/*"

# Attendre que Keycloak soit prêt
Write-Host "Attente de Keycloak..."
while ($true) {
    try {
        $response = Invoke-WebRequest -Uri "$KEYCLOAK_URL/health/ready" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}
Write-Host "Keycloak est prêt!"

# Obtenir le token admin
Write-Host "Obtention du token admin..."
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body @{
        username = $ADMIN_USER
        password = $ADMIN_PASSWORD
        grant_type = "password"
        client_id = "admin-cli"
    }

$ADMIN_TOKEN = $tokenResponse.access_token

if ([string]::IsNullOrEmpty($ADMIN_TOKEN)) {
    Write-Host "Erreur: Impossible d'obtenir le token admin"
    exit 1
}

Write-Host "Token admin obtenu avec succès"

# Headers pour les requêtes
$headers = @{
    "Authorization" = "Bearer $ADMIN_TOKEN"
    "Content-Type" = "application/json"
}

# Créer le realm Keystone
Write-Host "Création du realm $REALM_NAME..."
$realmBody = @{
    realm = $REALM_NAME
    enabled = $true
    displayName = "Keystone Enterprise"
    sslRequired = "external"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms" `
    -Method POST `
    -Headers $headers `
    -Body $realmBody

Write-Host "Realm $REALM_NAME créé"

# Créer le client React
Write-Host "Création du client $CLIENT_ID..."
$clientBody = @{
    clientId = $CLIENT_ID
    enabled = $true
    clientAuthenticatorType = "client-secret"
    secret = $CLIENT_SECRET
    redirectUris = @($REDIRECT_URI)
    webOrigins = @("http://localhost:3001")
    protocol = "openid-connect"
    publicClient = $false
    standardFlowEnabled = $true
    directAccessGrantsEnabled = $true
    attributes = @{
        "access.token.lifespan" = "3600"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" `
    -Method POST `
    -Headers $headers `
    -Body $clientBody

Write-Host "Client $CLIENT_ID créé"

# Créer les rôles
Write-Host "Création des rôles..."
$roles = @("admin", "manager", "employee")

foreach ($role in $roles) {
    $roleBody = @{
        name = $role
        description = "Role $role for Keystone application"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" `
        -Method POST `
        -Headers $headers `
        -Body $roleBody

    Write-Host "Rôle $role créé"
}

# Créer un utilisateur admin par défaut
Write-Host "Création de l'utilisateur admin par défaut..."
$userBody = @{
    username = "admin"
    enabled = $true
    emailVerified = $true
    email = "admin@keystone.com"
    firstName = "Admin"
    lastName = "User"
    credentials = @(
        @{
            type = "password"
            value = "admin123"
            temporary = $false
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" `
    -Method POST `
    -Headers $headers `
    -Body $userBody

# Assigner le rôle admin à l'utilisateur
Write-Host "Assignation du rôle admin à l'utilisateur..."
$userResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=admin" `
    -Method GET `
    -Headers $headers

$USER_ID = $userResponse[0].id

$roleResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/admin" `
    -Method GET `
    -Headers $headers

$ROLE_ID = $roleResponse.id

$roleMappingBody = @(
    @{
        id = $ROLE_ID
        name = "admin"
    }
) | ConvertTo-Json

Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$USER_ID/role-mappings/realm" `
    -Method POST `
    -Headers $headers `
    -Body $roleMappingBody

Write-Host "Configuration Keycloak terminée avec succès!"
Write-Host "=============================================="
Write-Host "URL Keycloak: $KEYCLOAK_URL"
Write-Host "Realm: $REALM_NAME"
Write-Host "Client ID: $CLIENT_ID"
Write-Host "Client Secret: $CLIENT_SECRET"
Write-Host "Utilisateur par défaut: admin / admin123"
Write-Host "=============================================="
