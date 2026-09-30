# test-roles.ps1 — Test role-based permissions across all services
$KONG = "http://localhost:8000"
$KEYCLOAK_URL = "http://localhost:8085"
$REALM = "keystone"
$CLIENT_ID = "keystone-react"
$CLIENT_SECRET = "keystone-secret"

function Get-Token {
    param([string]$username, [string]$password)
    $r = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" `
        -Method POST -ContentType "application/x-www-form-urlencoded" `
        -Body @{ username=$username; password=$password; grant_type="password"; client_id=$CLIENT_ID; client_secret=$CLIENT_SECRET }
    return $r.access_token
}

function Test-Access {
    param([string]$label, [string]$method, [string]$url, [string]$token, [int]$expected, [object]$body = $null)
    
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    $actualCode = 0
    try {
        if ($method -eq "GET") {
            $resp = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing
            $actualCode = $resp.StatusCode
        } elseif ($method -eq "POST") {
            $resp = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body ($body | ConvertTo-Json -Depth 10) -UseBasicParsing
            $actualCode = $resp.StatusCode
        } elseif ($method -eq "PUT") {
            $resp = Invoke-WebRequest -Uri $url -Method PUT -Headers $headers -Body ($body | ConvertTo-Json -Depth 10) -UseBasicParsing
            $actualCode = $resp.StatusCode
        } elseif ($method -eq "DELETE") {
            $resp = Invoke-WebRequest -Uri $url -Method DELETE -Headers $headers -UseBasicParsing
            $actualCode = $resp.StatusCode
        }
    } catch {
        $actualCode = [int]$_.Exception.Response.StatusCode
        if ($actualCode -eq 0) {
            $actualCode = -1
            Write-Host "  [CONN ERROR] $label" -ForegroundColor DarkYellow
            return
        }
    }
    
    $pass = ($actualCode -eq $expected)
    $icon = if ($pass) { "[PASS]" } else { "[FAIL]" }
    $color = if ($pass) { "Green" } else { "Red" }
    Write-Host "  $icon $label (expected $expected, got $actualCode)" -ForegroundColor $color
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ROLE-BASED PERMISSION TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get tokens
Write-Host "`nGetting tokens..."
$adminToken = Get-Token -username "admin" -password "admin123"
$managerToken = Get-Token -username "manager1" -password "manager123"
$hrToken = Get-Token -username "hr1" -password "hr123"
$employeeToken = Get-Token -username "user" -password "user123"
Write-Host "All tokens obtained.`n"

# ============================================================
# TEST 1: MANAGER role
# ============================================================
Write-Host "--- MANAGER tests ---" -ForegroundColor Yellow

# Manager CAN create a task (POST /tasks) -> 201
Test-Access -label "MANAGER can POST /tasks" -method "POST" -url "$KONG/tasks" -token $managerToken -expected 201 -body @{
    title = "Test task by manager"
    description = "Permission test"
    employeeId = "test-user-id"
    employeeUsername = "user"
    priority = "LOW"
}

# Manager CAN get all tasks (GET /tasks) -> 200
Test-Access -label "MANAGER can GET /tasks" -method "GET" -url "$KONG/tasks" -token $managerToken -expected 200

# Manager CANNOT create a department (POST /departments) -> 403
Test-Access -label "MANAGER cannot POST /departments" -method "POST" -url "$KONG/departments" -token $managerToken -expected 403 -body @{
    name = "Test Dept"
    description = "Should fail"
}

# Manager CANNOT approve leave (PUT /leaves/:id/approve) -> 403
Test-Access -label "MANAGER cannot PUT /leaves/1/approve" -method "PUT" -url "$KONG/leaves/1/approve" -token $managerToken -expected 403

# Manager CANNOT get all employees via auth (GET /auth/employees) -> 403
Test-Access -label "MANAGER cannot GET /auth/employees" -method "GET" -url "$KONG/auth/employees" -token $managerToken -expected 403

# Manager CAN approve meeting (PUT /meetings/:id/approve) -> 200 or 404
# (404 is acceptable if meeting doesn't exist, it means the role check passed)
Test-Access -label "MANAGER can PUT /meetings/1/approve (200 or 404)" -method "PUT" -url "$KONG/meetings/1/approve" -token $managerToken -expected 200

# Manager CAN create room (POST /rooms) -> 201
Test-Access -label "MANAGER can POST /rooms" -method "POST" -url "$KONG/rooms" -token $managerToken -expected 201 -body @{
    name = "Manager Test Room"
    capacity = 5
    location = "Test"
}

# ============================================================
# TEST 2: HR role
# ============================================================
Write-Host "`n--- HR tests ---" -ForegroundColor Yellow

# HR CAN approve leave (PUT /leaves/:id/approve) -> 200 or 404
Test-Access -label "HR can PUT /leaves/1/approve" -method "PUT" -url "$KONG/leaves/1/approve" -token $hrToken -expected 200

# HR CAN get all leaves (GET /leaves) -> 200
Test-Access -label "HR can GET /leaves" -method "GET" -url "$KONG/leaves" -token $hrToken -expected 200

# HR CAN get employees via auth (GET /auth/employees) -> 200
Test-Access -label "HR can GET /auth/employees" -method "GET" -url "$KONG/auth/employees" -token $hrToken -expected 200

# HR CANNOT create a task (POST /tasks) -> 403
Test-Access -label "HR cannot POST /tasks" -method "POST" -url "$KONG/tasks" -token $hrToken -expected 403 -body @{
    title = "Test task by HR"
    description = "Should fail"
    employeeId = "test-user-id"
    employeeUsername = "user"
    priority = "LOW"
}

# HR CANNOT create a department (POST /departments) -> 403
Test-Access -label "HR cannot POST /departments" -method "POST" -url "$KONG/departments" -token $hrToken -expected 403 -body @{
    name = "Test Dept HR"
    description = "Should fail"
}

# HR CANNOT approve meeting (PUT /meetings/:id/approve) -> 403
Test-Access -label "HR cannot PUT /meetings/1/approve" -method "PUT" -url "$KONG/meetings/1/approve" -token $hrToken -expected 403

# HR CANNOT create room (POST /rooms) -> 403
Test-Access -label "HR cannot POST /rooms" -method "POST" -url "$KONG/rooms" -token $hrToken -expected 403 -body @{
    name = "HR Test Room"
    capacity = 5
    location = "Test"
}

# ============================================================
# TEST 3: EMPLOYEE role (sanity checks)
# ============================================================
Write-Host "`n--- EMPLOYEE tests ---" -ForegroundColor Yellow

# Employee CANNOT create task -> 403
Test-Access -label "EMPLOYEE cannot POST /tasks" -method "POST" -url "$KONG/tasks" -token $employeeToken -expected 403 -body @{
    title = "Test task by emp"
    description = "Should fail"
    employeeId = "test"
    employeeUsername = "user"
    priority = "LOW"
}

# Employee CANNOT approve leave -> 403
Test-Access -label "EMPLOYEE cannot PUT /leaves/1/approve" -method "PUT" -url "$KONG/leaves/1/approve" -token $employeeToken -expected 403

# Employee CAN get own tasks -> 200
Test-Access -label "EMPLOYEE can GET /tasks/my" -method "GET" -url "$KONG/tasks/my" -token $employeeToken -expected 200

# Employee CAN create leave request -> 201
Test-Access -label "EMPLOYEE can POST /leaves" -method "POST" -url "$KONG/leaves" -token $employeeToken -expected 201 -body @{
    type = "conge"
    start_date = "2026-12-15"
    end_date = "2026-12-16"
    reason = "Test leave"
    status = "en_attente"
}

# ============================================================
# TEST 4: ADMIN role (sanity checks)
# ============================================================
Write-Host "`n--- ADMIN tests ---" -ForegroundColor Yellow

$ts = Get-Date -Format 'yyyyMMddHHmmss'

# Admin CAN create department -> 201
Test-Access -label "ADMIN can POST /departments" -method "POST" -url "$KONG/departments" -token $adminToken -expected 201 -body @{
    name = "Admin Test Dept $ts"
    description = "Admin test"
}

# Admin CAN approve leave -> 200
Test-Access -label "ADMIN can PUT /leaves/1/approve" -method "PUT" -url "$KONG/leaves/1/approve" -token $adminToken -expected 200

# Admin CAN create task -> 201
Test-Access -label "ADMIN can POST /tasks" -method "POST" -url "$KONG/tasks" -token $adminToken -expected 201 -body @{
    title = "Admin test task"
    description = "Admin test"
    employeeId = "test-user-id"
    employeeUsername = "user"
    priority = "HIGH"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTS COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
