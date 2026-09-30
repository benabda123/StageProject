# verify-login.ps1
$r1 = Invoke-RestMethod -Uri "http://localhost:8085/realms/keystone/protocol/openid-connect/token" `
    -Method POST -ContentType "application/x-www-form-urlencoded" `
    -Body @{ username="manager1"; password="manager123"; grant_type="password"; client_id="keystone-react"; client_secret="keystone-secret" }
Write-Host "manager1 login: OK (token length: $($r1.access_token.Length))"

$r2 = Invoke-RestMethod -Uri "http://localhost:8085/realms/keystone/protocol/openid-connect/token" `
    -Method POST -ContentType "application/x-www-form-urlencoded" `
    -Body @{ username="hr1"; password="hr123"; grant_type="password"; client_id="keystone-react"; client_secret="keystone-secret" }
Write-Host "hr1 login: OK (token length: $($r2.access_token.Length))"

# Decode and show roles
$parts1 = $r1.access_token.Split('.')
$payload1 = $parts1[1]
# Add padding
while ($payload1.Length % 4) { $payload1 += "=" }
$decoded1 = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload1))
$json1 = $decoded1 | ConvertFrom-Json
Write-Host "manager1 roles: $($json1.realm_access.roles -join ', ')"

$parts2 = $r2.access_token.Split('.')
$payload2 = $parts2[1]
while ($payload2.Length % 4) { $payload2 += "=" }
$decoded2 = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload2))
$json2 = $decoded2 | ConvertFrom-Json
Write-Host "hr1 roles: $($json2.realm_access.roles -join ', ')"
