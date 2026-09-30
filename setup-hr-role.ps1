# setup-hr-role.ps1 — Create hr role + test accounts
$KEYCLOAK_URL = "http://localhost:8085"
$REALM_NAME = "keystone"

# Get admin token
Write-Host "Getting admin token..."
$tokenResp = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body @{
        username = "admin"
        password = "admin"
        grant_type = "password"
        client_id = "admin-cli"
    }

$ADMIN_TOKEN = $tokenResp.access_token
if ([string]::IsNullOrEmpty($ADMIN_TOKEN)) {
    Write-Host "ERROR: Could not get admin token"
    exit 1
}
Write-Host "Admin token OK"

$headers = @{
    "Authorization" = "Bearer $ADMIN_TOKEN"
    "Content-Type" = "application/json"
}

# Step 1: Create hr role
Write-Host "`n--- Creating 'hr' role ---"
$roleBody = '{"name": "hr", "description": "Role HR for Keystone application"}'
try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" `
        -Method POST `
        -Headers $headers `
        -Body $roleBody
    Write-Host "Role 'hr' created"
} catch {
    $err = $_.ErrorDetails.Message
    if ($err -match "already exists") {
        Write-Host "Role 'hr' already exists, skipping"
    } else {
        Write-Host "Error creating role: $err"
    }
}

# Helper: create user with role
function Create-UserWithRole {
    param([string]$username, [string]$password, [string]$firstName, [string]$lastName, [string]$roleName)

    Write-Host "`n--- Creating user '$username' with role '$roleName' ---"

    # Create user
    $userBody = @{
        username = $username
        enabled = $true
        emailVerified = $true
        email = "$username@keystone.com"
        firstName = $firstName
        lastName = $lastName
        credentials = @(
            @{
                type = "password"
                value = $password
                temporary = $false
            }
        )
    } | ConvertTo-Json -Depth 10

    try {
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" `
            -Method POST `
            -Headers $headers `
            -Body $userBody
        Write-Host "User '$username' created"
    } catch {
        $err = $_.ErrorDetails.Message
        if ($err -match "already exists" -or $err -match "UserExistsException" -or $err -match "Conflict") {
            Write-Host "User '$username' already exists, skipping creation"
        } else {
            Write-Host "Error creating user: $err"
            return
        }
    }

    # Get user ID
    $users = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=$username" `
        -Method GET `
        -Headers $headers
    $userId = $users[0].id

    if ([string]::IsNullOrEmpty($userId)) {
        Write-Host "ERROR: Could not find user ID for '$username'"
        return
    }
    Write-Host "User ID: $userId"

    # Get role ID
    $roleResp = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/$roleName" `
        -Method GET `
        -Headers $headers
    $roleId = $roleResp.id

    if ([string]::IsNullOrEmpty($roleId)) {
        Write-Host "ERROR: Could not find role ID for '$roleName'"
        return
    }
    Write-Host "Role '$roleName' ID: $roleId"

    # Assign role
    $roleMappingBody = @(
        @{
            id = $roleId
            name = $roleName
        }
    ) | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$userId/role-mappings/realm" `
            -Method POST `
            -Headers $headers `
            -Body $roleMappingBody
        Write-Host "Role '$roleName' assigned to '$username'"
    } catch {
        $err = $_.ErrorDetails.Message
        if ($err -match "already" -or $err -match "Conflict") {
            Write-Host "Role '$roleName' already assigned to '$username'"
        } else {
            Write-Host "Error assigning role: $err"
        }
    }
}

# Step 2: Create manager test account (reuses existing 'youcef' if present, otherwise creates manager1)
Create-UserWithRole -username "manager1" -password "manager123" -firstName "Manager" -lastName "Test" -roleName "manager"

# Step 3: Create hr test account
Create-UserWithRole -username "hr1" -password "hr123" -firstName "HR" -lastName "Test" -roleName "hr"

Write-Host "`n=========================================="
Write-Host "Setup complete!"
Write-Host "Test accounts:"
Write-Host "  manager1 / manager123  (role: manager)"
Write-Host "  hr1 / hr123            (role: hr)"
Write-Host "=========================================="
