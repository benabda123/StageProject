# test-ai-assistant.ps1
$KONG = "http://localhost:8000"
$KEYCLOAK_URL = "http://localhost:8085"
$REALM = "keystone"
$CLIENT_ID = "keystone-react"
$CLIENT_SECRET = "keystone-secret"

function Get-Token {
    param([string]$username, [string]$password)
    try {
        $r = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" `
            -Method POST -ContentType "application/x-www-form-urlencoded" `
            -Body @{ username=$username; password=$password; grant_type="password"; client_id=$CLIENT_ID; client_secret=$CLIENT_SECRET }
        return $r.access_token
    } catch {
        Write-Host "Erreur obtention token pour $username : $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTS AI ASSISTANT SERVICE (/ai/meeting-plan)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$managerToken = Get-Token -username "manager1" -password "manager123"
$employeeToken = Get-Token -username "user" -password "user123"

if (-not $managerToken -or -not $employeeToken) {
    Write-Host "Impossible d'obtenir les tokens de test." -ForegroundColor Red
    exit 1
}

# ----------------------------------------------------
# TEST 1: Call /ai/meeting-plan as manager with valid objective
# ----------------------------------------------------
Write-Host "`n--- TEST 1: Manager appelle POST /ai/meeting-plan ---" -ForegroundColor Yellow
$bodyObj = @{
    objective = "Je veux organiser une réunion avec l'équipe de développement pour faire le point sur les tâches qui prennent trop de temps"
}

$headersManager = @{
    "Authorization" = "Bearer $managerToken"
    "Content-Type"  = "application/json"
}

$test1Passed = $false
$resp1 = $null
try {
    $resp1 = Invoke-RestMethod -Uri "$KONG/ai/meeting-plan" -Method POST -Headers $headersManager -Body ($bodyObj | ConvertTo-Json)
    Write-Host "[PASS] Statut 200 OK" -ForegroundColor Green
    Write-Host "Résultat JSON obtenu :" -ForegroundColor DarkCyan
    $resp1Json = $resp1 | ConvertTo-Json -Depth 5
    Write-Host $resp1Json

    # Validation du schéma
    if ($resp1.title -and $resp1.objective -and $resp1.durationMinutes -and $resp1.participants -and $resp1.agenda) {
        Write-Host "[PASS] Le JSON respecte le schéma attendu !" -ForegroundColor Green
        $test1Passed = $true
    } else {
        Write-Host "[FAIL] Schéma JSON incomplet" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Erreur lors de l'appel /ai/meeting-plan : $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Détails erreur : $($reader.ReadToEnd())" -ForegroundColor Red
    }
}

# ----------------------------------------------------
# TEST 2: Vérification des participants suggérés
# ----------------------------------------------------
Write-Host "`n--- TEST 2: Vérification que les participants sont de vrais employés ---" -ForegroundColor Yellow
try {
    $internalKey = "JMWBrs0AfidlYFRaZn7ghGpT2mvXSqx9E1ytkO5zeKcIV4QNwHo83bCLDjUP6u"
    $realEmployees = Invoke-RestMethod -Uri "http://localhost:8084/internal/employees" -Headers @{ "x-internal-api-key" = $internalKey }
    $realUsernames = $realEmployees | ForEach-Object { $_.username }

    Write-Host "Utilisateurs réels en base : $($realUsernames -join ', ')" -ForegroundColor Gray

    if ($test1Passed -and $resp1.participants) {
        $suggestedUsernames = $resp1.participants | ForEach-Object { $_.username }
        Write-Host "Participants suggérés par l'IA : $($suggestedUsernames -join ', ')" -ForegroundColor DarkCyan

        $allReal = $true
        foreach ($u in $suggestedUsernames) {
            if ($realUsernames -contains $u) {
                Write-Host "  [PASS] Participant '$u' existe bien en base" -ForegroundColor Green
            } else {
                Write-Host "  [WARN/FAIL] Participant '$u' non trouvé dans la liste des vrais employés" -ForegroundColor Red
                $allReal = $false
            }
        }
    } else {
        Write-Host "[SKIP] Test 1 n'a pas produit de résultat." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[FAIL] Impossible d'effectuer la vérification des employés : $_" -ForegroundColor Red
}

# ----------------------------------------------------
# TEST 3: Compte employee tente d'appeler la route -> 403 attendu
# ----------------------------------------------------
Write-Host "`n--- TEST 3: Compte employee appelle POST /ai/meeting-plan (403 attendu) ---" -ForegroundColor Yellow
$headersEmployee = @{
    "Authorization" = "Bearer $employeeToken"
    "Content-Type"  = "application/json"
}

try {
    $resp3 = Invoke-WebRequest -Uri "$KONG/ai/meeting-plan" -Method POST -Headers $headersEmployee -Body ($bodyObj | ConvertTo-Json) -UseBasicParsing
    Write-Host "[FAIL] Attendu 403 Forbidden, mais reçu statut $($resp3.StatusCode)" -ForegroundColor Red
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    if ($statusCode -eq 403) {
        Write-Host "[PASS] 403 Forbidden reçu comme attendu !" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Attendu 403, reçu $statusCode : $_" -ForegroundColor Red
    }
}

# ----------------------------------------------------
# TEST 4: Erreur si clé Gemini absente ou invalide
# ----------------------------------------------------
Write-Host "`n--- TEST 4: Erreur gérée proprement si clé Gemini absente/invalide ---" -ForegroundColor Yellow
try {
    # Test execution within container with empty API key
    $resErr = docker exec ai-assistant-service node -e "delete process.env.GEMINI_API_KEY; require('./src/adapters/output/GeminiClient').generateMeetingPlan('test', {}).catch(e => console.log('ERROR_CAPTURED:', e.message))"
    if ($resErr -match "ERROR_CAPTURED") {
        Write-Host "[PASS] Message d'erreur clair capturé sans crash :" -ForegroundColor Green
        Write-Host "  $resErr" -ForegroundColor DarkCyan
    } else {
        Write-Host "[FAIL] Résultat inattendu : $resErr" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Erreur test sans clé Gemini : $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTS TERMINÉS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
