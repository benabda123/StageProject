# Create itsupport role + test account in Keycloak
$ErrorActionPreference = "Stop"

$keycloakUrl = "http://localhost:8085"
$realm = "keystone"

# Step 1: Get admin token
$tokenBody = "grant_type=password&client_id=admin-cli&username=admin&password=admin"
$tokenResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/master/protocol/openid-connect/token" -Method POST -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
$token = $tokenResponse.access_token
Write-Host "Admin token obtained." -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token" }

# Step 2: Check if itsupport role exists
try {
    $existingRole = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/roles/itsupport" -Headers $headers -Method GET
    $roleId = $existingRole.id
    Write-Host "itsupport role already exists (id: $roleId)" -ForegroundColor Yellow
} catch {
    # Create the role
    $roleJson = '{"name":"itsupport","description":"IT Support role for Keystone application"}'
    try {
        Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/roles" -Method POST -Headers $headers -Body $roleJson -ContentType "application/json"
        $existingRole = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/roles/itsupport" -Headers $headers -Method GET
        $roleId = $existingRole.id
        Write-Host "itsupport role created (id: $roleId)" -ForegroundColor Green
    } catch {
        Write-Host "Error creating role: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Check if itsupport1 user exists
$users = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users?username=itsupport1" -Headers $headers -Method GET
if ($users.Count -gt 0) {
    $userId = $users[0].id
    Write-Host "itsupport1 user already exists (id: $userId)" -ForegroundColor Yellow
} else {
    # Create the user
    $userJson = '{"username":"itsupport1","enabled":true,"credentials":[{"type":"password","value":"itsupport123","temporary":false}]}'
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users" -Method POST -Headers $headers -Body $userJson -ContentType "application/json"
    $users = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users?username=itsupport1" -Headers $headers -Method GET
    $userId = $users[0].id
    Write-Host "itsupport1 user created (id: $userId)" -ForegroundColor Green
}

# Step 4: Assign itsupport role to itsupport1
$roleJson = "[{`"id`":`"$roleId`",`"name`":`"itsupport`"}]"
try {
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users/$userId/role-mappings/realm" -Method POST -Headers $headers -Body $roleJson -ContentType "application/json"
    Write-Host "itsupport role assigned to itsupport1" -ForegroundColor Green
} catch {
    Write-Host "Role may already be assigned: $_" -ForegroundColor Yellow
}

# Step 5: Also assign employee role to itsupport1 (so they can also create tickets)
try {
    $empRole = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/roles/employee" -Headers $headers -Method GET
    $empRoleId = $empRole.id
    $empRoleJson = "[{`"id`":`"$empRoleId`",`"name`":`"employee`"}]"
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users/$userId/role-mappings/realm" -Method POST -Headers $headers -Body $empRoleJson -ContentType "application/json"
    Write-Host "employee role assigned to itsupport1" -ForegroundColor Green
} catch {
    Write-Host "employee role may already be assigned: $_" -ForegroundColor Yellow
}

# Step 6: Verify
$roles = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users/$userId/role-mappings/realm" -Headers $headers -Method GET
$roleNames = ($roles | ForEach-Object { $_.name }) -join ", "
Write-Host "itsupport1 roles: $roleNames" -ForegroundColor Cyan

# Step 7: Test login
$testBody = "grant_type=password&client_id=keystone-frontend&username=itsupport1&password=itsupport123"
try {
    $testResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/$realm/protocol/openid-connect/token" -Method POST -Body $testBody -ContentType "application/x-www-form-urlencoded"
    Write-Host "itsupport1 login successful!" -ForegroundColor Green
} catch {
    Write-Host "itsupport1 login failed: $_" -ForegroundColor Red
}

Write-Host "`nDone! Test credentials: itsupport1 / itsupport123" -ForegroundColor Green
