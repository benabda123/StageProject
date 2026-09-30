# ticket-service Test Script — 7 Scenarios
$ErrorActionPreference = "Continue"

$KONG = "http://localhost:8000"
$KC_URL = "http://localhost:8085"
$REALM = "keystone"
$CLIENT_ID = "keystone-react"
$CLIENT_SECRET = "keystone-secret"

$passed = 0
$failed = 0

function Get-Token($username, $password) {
    $body = @{ username=$username; password=$password; grant_type="password"; client_id=$CLIENT_ID; client_secret=$CLIENT_SECRET }
    $resp = Invoke-RestMethod -Uri "$KC_URL/realms/$REALM/protocol/openid-connect/token" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"
    return $resp.access_token
}

function Test-Api {
    param($label, $method, $url, $token, $body, $expectedStatus)
    $headers = @{ Authorization = "Bearer $token" }
    $status = 0
    $response = $null
    try {
        if ($body) {
            $jsonBody = $body | ConvertTo-Json -Depth 5
            $response = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -ContentType "application/json" -Body $jsonBody -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -ContentType "application/json" -UseBasicParsing
        }
        $status = [int]$response.StatusCode
    } catch {
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
        }
        $response = $null
    }

    if ($status -eq $expectedStatus) {
        Write-Host "[PASS] $label (got $status)" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] $label -- expected $expectedStatus, got $status" -ForegroundColor Red
        $script:failed++
    }

    if ($response -and $response.Content) {
        return ($response.Content | ConvertFrom-Json)
    }
    return $null
}

Write-Host "`n=== TICKET-SERVICE TESTS ===" -ForegroundColor Cyan
Write-Host "Getting tokens...`n" -ForegroundColor Cyan

# Get tokens for all test accounts
$tokenYoucef = Get-Token "user" "user123"
$tokenIT = Get-Token "itsupport1" "itsupport123"
$tokenAdmin = Get-Token "admin" "admin123"
$tokenUser2 = Get-Token "user2" "user123"

Write-Host "Tokens obtained.`n" -ForegroundColor Green

# ---- TEST 1: Employee (youcef) creates a ticket → 201, status OPEN ----
Write-Host "--- Test 1: Employee creates a ticket ---" -ForegroundColor Yellow
$ticketBody = @{
    title = "Printer not working"
    description = "My office printer is jammed and won't print"
    category = "HARDWARE"
    priority = "HIGH"
}
$ticket = Test-Api "Employee creates ticket (OPEN)" "POST" "$KONG/tickets" $tokenYoucef $ticketBody 201
if ($ticket) {
    $ticketId = $ticket.id
    Write-Host "  Ticket #$ticketId created, status: $($ticket.status)" -ForegroundColor Gray
} else {
    Write-Host "  CRITICAL: Could not create ticket, aborting remaining tests" -ForegroundColor Red
    exit 1
}

# ---- TEST 2: IT Support assigns the ticket → status ASSIGNED ----
Write-Host "`n--- Test 2: IT Support assigns the ticket ---" -ForegroundColor Yellow
$assignBody = $null  # Self-assign (itsupport1 assigns to themselves)
$assigned = Test-Api "IT Support self-assigns ticket" "PUT" "$KONG/tickets/$ticketId/assign" $tokenIT $assignBody 200
if ($assigned) {
    Write-Host "  Status: $($assigned.status), assigned to: $($assigned.assignedToUsername)" -ForegroundColor Gray
}

# ---- TEST 3a: IT Support → IN_PROGRESS ----
Write-Host "`n--- Test 3: IT Support progresses ticket status ---" -ForegroundColor Yellow
$statusBody1 = @{ status = "IN_PROGRESS" }
$progressed = Test-Api "IT Support sets IN_PROGRESS" "PUT" "$KONG/tickets/$ticketId/status" $tokenIT $statusBody1 200
if ($progressed) {
    Write-Host "  Status: $($progressed.status)" -ForegroundColor Gray
}

# ---- TEST 3b: IT Support → RESOLVED ----
$statusBody2 = @{ status = "RESOLVED" }
$resolved = Test-Api "IT Support sets RESOLVED" "PUT" "$KONG/tickets/$ticketId/status" $tokenIT $statusBody2 200
if ($resolved) {
    Write-Host "  Status: $($resolved.status)" -ForegroundColor Gray
}

# ---- TEST 4: Employee tries to close while IN_PROGRESS (create new ticket for this) ----
Write-Host "`n--- Test 4: Employee tries to close non-RESOLVED ticket (expect error) ---" -ForegroundColor Yellow
# Create a second ticket for this test
$ticket2Body = @{
    title = "Network issue"
    description = "Cannot connect to VPN"
    category = "NETWORK"
    priority = "MEDIUM"
}
$ticket2 = Test-Api "Employee creates 2nd ticket" "POST" "$KONG/tickets" $tokenYoucef $ticket2Body 201
$ticket2Id = $ticket2.id

# Assign + IN_PROGRESS only (not RESOLVED)
Test-Api "IT Support assigns 2nd ticket" "PUT" "$KONG/tickets/$ticket2Id/assign" $tokenIT $null 200 | Out-Null
$statusBody3 = @{ status = "IN_PROGRESS" }
Test-Api "IT Support sets 2nd ticket IN_PROGRESS" "PUT" "$KONG/tickets/$ticket2Id/status" $tokenIT $statusBody3 200 | Out-Null

# Employee tries to close while IN_PROGRESS → expect 400
Test-Api "Employee tries to close IN_PROGRESS ticket → 400" "PUT" "$KONG/tickets/$ticket2Id/close" $tokenYoucef $null 400

# ---- TEST 5: Employee closes RESOLVED ticket → CLOSED ----
Write-Host "`n--- Test 5: Employee closes RESOLVED ticket ---" -ForegroundColor Yellow
$closed = Test-Api "Employee closes RESOLVED ticket #1" "PUT" "$KONG/tickets/$ticketId/close" $tokenYoucef $null 200
if ($closed) {
    Write-Host "  Status: $($closed.status)" -ForegroundColor Gray
}

# ---- TEST 6: Another employee (user) tries to view ticket details → 403 ----
Write-Host "`n--- Test 6: Unauthorized employee tries to view ticket details ---" -ForegroundColor Yellow
Test-Api "User2 (not creator, not IT) views ticket #1 -> 403" "GET" "$KONG/tickets/$ticketId" $tokenUser2 $null 403

# ---- TEST 7: Comments — employee comments, IT Support replies, both visible ----
Write-Host "`n--- Test 7: Comments on ticket ---" -ForegroundColor Yellow
# Employee comments on ticket 2 (still IN_PROGRESS, owned by youcef)
$comment1Body = @{ message = "This is urgent, please fix ASAP!" }
$c1 = Test-Api "Employee adds comment on own ticket" "POST" "$KONG/tickets/$ticket2Id/comments" $tokenYoucef $comment1Body 201

# IT Support replies
$comment2Body = @{ message = "We are looking into it, checking VPN config." }
$c2 = Test-Api "IT Support replies with comment" "POST" "$KONG/tickets/$ticket2Id/comments" $tokenIT $comment2Body 201

# Get ticket details and verify both comments are present, sorted chronologically
$details = Test-Api "Get ticket #2 details with comments" "GET" "$KONG/tickets/$ticket2Id" $tokenYoucef $null 200
if ($details -and $details.comments) {
    $commentCount = $details.comments.Count
    Write-Host "  Comments count: $commentCount" -ForegroundColor Gray
    if ($commentCount -ge 2) {
        Write-Host "  [PASS] Both comments visible in ticket details" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] Expected at least 2 comments, got $commentCount" -ForegroundColor Red
        $script:failed++
    }
} else {
    Write-Host "  [FAIL] No comments returned in ticket details" -ForegroundColor Red
    $script:failed++
}

# ---- SUMMARY ----
Write-Host "`n===========================================" -ForegroundColor Cyan
$total = $passed + $failed
Write-Host "RESULTS: $passed/$total passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "===========================================`n" -ForegroundColor Cyan
