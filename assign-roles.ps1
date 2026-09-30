# assign-roles.ps1 — Fix role assignments for manager1 and hr1
$KEYCLOAK_URL = "http://localhost:8085"
$REALM_NAME = "keystone"

$tokenResp = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -Method POST -ContentType "application/x-www-form-urlencoded" `
    -Body @{ username="admin"; password="admin"; grant_type="password"; client_id="admin-cli" }
$ADMIN_TOKEN = $tokenResp.access_token
Write-Host "Token OK"

$headers = @{ "Authorization" = "Bearer $ADMIN_TOKEN"; "Content-Type" = "application/json" }

function Assign-Role {
    param([string]$username, [string]$roleName)
    
    $users = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=$username" -Method GET -Headers $headers
    $userId = $users[0].id
    Write-Host "$username ID: $userId"

    $role = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/$roleName" -Method GET -Headers $headers
    $roleId = $role.id
    Write-Host "$roleName role ID: $roleId"

    # Use raw JSON string to avoid PowerShell array serialization issues
    $body = "[{`"id`":`"$roleId`",`"name`":`"$roleName`"}]"
    Write-Host "Body: $body"

    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$userId/role-mappings/realm" `
        -Method POST -Headers $headers -Body $body
    Write-Host "Role '$roleName' assigned to '$username'"
}

Assign-Role -username "manager1" -roleName "manager"
Assign-Role -username "hr1" -roleName "hr"

Write-Host "`nDone! Verifying..."

# Verify
$users1 = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=manager1" -Method GET -Headers $headers
$roles1 = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$($users1[0].id)/role-mappings/realm" -Method GET -Headers $headers
Write-Host "manager1 roles: $($roles1 | ForEach-Object { $_.name } | Join-String -Separator ', ')"

$users2 = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=hr1" -Method GET -Headers $headers
$roles2 = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$($users2[0].id)/role-mappings/realm" -Method GET -Headers $headers
Write-Host "hr1 roles: $($roles2 | ForEach-Object { $_.name } | Join-String -Separator ', ')"
