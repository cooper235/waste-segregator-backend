# Smart Waste Segregator API Testing Script for Windows PowerShell
# This script provides examples for testing all major API endpoints

# Configuration
$baseUrl = "http://localhost:5000/api"
$iotApiKey = "test-api-key-123"

# Colors for output
$successColor = "Green"
$errorColor = "Red"
$infoColor = "Cyan"

Write-Host "========================================" -ForegroundColor $infoColor
Write-Host "Smart Waste Segregator API Test Suite" -ForegroundColor $infoColor
Write-Host "========================================" -ForegroundColor $infoColor

# ==================== AUTHENTICATION TESTS ====================
Write-Host "`n[1] AUTHENTICATION TESTS" -ForegroundColor $infoColor

# Register Admin User
Write-Host "`nRegistering admin user..." -ForegroundColor $infoColor
$registerBody = @{
    email = "admin@test.com"
    password = "SecurePass123!"
    name = "Test Admin"
    role = "admin"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✓ Registration successful" -ForegroundColor $successColor
    $accessToken = $registerResponse.data.accessToken
    $refreshToken = $registerResponse.data.refreshToken
    Write-Host "Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor $infoColor
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor $errorColor
}

# Login
Write-Host "`nLogging in..." -ForegroundColor $infoColor
$loginBody = @{
    email = "admin@test.com"
    password = "SecurePass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "✓ Login successful" -ForegroundColor $successColor
    $accessToken = $loginResponse.data.accessToken
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor $errorColor
}

# ==================== BINS TESTS ====================
Write-Host "`n[2] BINS MANAGEMENT TESTS" -ForegroundColor $infoColor

# Create Bins
$binCategories = @("metal", "biodegradable", "non-biodegradable", "others")
$binIds = @()

foreach ($i in 0..3) {
    Write-Host "`nCreating bin for category: $($binCategories[$i])..." -ForegroundColor $infoColor
    
    $binBody = @{
        binId = "BIN-TEST-$(($i+1).ToString('D3'))"
        category = $binCategories[$i]
        location = "Test Location $($i+1)"
        capacity = 100
    } | ConvertTo-Json
    
    try {
        $binResponse = Invoke-RestMethod -Uri "$baseUrl/bins" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ Authorization = "Bearer $accessToken" } `
            -Body $binBody
        
        Write-Host "✓ Bin created: $($binResponse.data.binId)" -ForegroundColor $successColor
        $binIds += $binResponse.data.binId
    } catch {
        Write-Host "✗ Bin creation failed: $($_.Exception.Message)" -ForegroundColor $errorColor
    }
}

# Get All Bins
Write-Host "`nFetching all bins..." -ForegroundColor $infoColor
try {
    $binsResponse = Invoke-RestMethod -Uri "$baseUrl/bins?page=1&limit=10" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $accessToken" }
    
    Write-Host "✓ Retrieved $($binsResponse.data.Count) bins" -ForegroundColor $successColor
    foreach ($bin in $binsResponse.data) {
        Write-Host "  - $($bin.binId) ($($bin.category)): $($bin.fillLevel)% full" -ForegroundColor $infoColor
    }
} catch {
    Write-Host "✗ Failed to fetch bins: $($_.Exception.Message)" -ForegroundColor $errorColor
}

# Update Bin
if ($binIds.Count -gt 0) {
    Write-Host "`nUpdating first bin..." -ForegroundColor $infoColor
    $updateBody = @{
        location = "Updated Location"
        status = "active"
    } | ConvertTo-Json
    
    try {
        $updateResponse = Invoke-RestMethod -Uri "$baseUrl/bins/$($binIds[0])" `
            -Method PATCH `
            -ContentType "application/json" `
            -Headers @{ Authorization = "Bearer $accessToken" } `
            -Body $updateBody
        
        Write-Host "✓ Bin updated successfully" -ForegroundColor $successColor
    } catch {
        Write-Host "✗ Bin update failed: $($_.Exception.Message)" -ForegroundColor $errorColor
    }
}

# ==================== IoT TESTS ====================
Write-Host "`n[3] IoT ENDPOINTS TESTS" -ForegroundColor $infoColor

# Send Device Update
if ($binIds.Count -gt 0) {
    Write-Host "`nSending device update..." -ForegroundColor $infoColor
    $iotBody = @{
        binId = $binIds[0]
        fillLevel = 75
        sensorStatus = "ok"
    } | ConvertTo-Json
    
    try {
        $iotResponse = Invoke-RestMethod -Uri "$baseUrl/iot/update" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "X-API-Key" = $iotApiKey } `
            -Body $iotBody
        
        Write-Host "✓ Device update received" -ForegroundColor $successColor
    } catch {
        Write-Host "✗ Device update failed: $($_.Exception.Message)" -ForegroundColor $errorColor
    }
}

# Get Commands
if ($binIds.Count -gt 0) {
    Write-Host "`nFetching commands for bin..." -ForegroundColor $infoColor
    try {
        $commandsResponse = Invoke-RestMethod -Uri "$baseUrl/iot/commands/$($binIds[0])" `
            -Method GET `
            -Headers @{ "X-API-Key" = $iotApiKey }
        
        Write-Host "✓ Retrieved $($commandsResponse.data.Count) commands" -ForegroundColor $successColor
    } catch {
        Write-Host "✗ Failed to fetch commands: $($_.Exception.Message)" -ForegroundColor $errorColor
    }
}

# ==================== ANALYTICS TESTS ====================
Write-Host "`n[4] ANALYTICS TESTS" -ForegroundColor $infoColor

# Get Waste Count
Write-Host "`nFetching waste count analytics..." -ForegroundColor $infoColor
try {
    $analyticsResponse = Invoke-RestMethod -Uri "$baseUrl/analytics/waste-count" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $accessToken" }
    
    Write-Host "✓ Analytics retrieved" -ForegroundColor $successColor
    Write-Host "  Categories: $($analyticsResponse.data.labels -join ', ')" -ForegroundColor $infoColor
} catch {
    Write-Host "✗ Analytics fetch failed: $($_.Exception.Message)" -ForegroundColor $errorColor
}

# Get Dashboard Summary
Write-Host "`nFetching dashboard summary..." -ForegroundColor $infoColor
try {
    $dashboardResponse = Invoke-RestMethod -Uri "$baseUrl/analytics/dashboard" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $accessToken" }
    
    Write-Host "✓ Dashboard summary retrieved" -ForegroundColor $successColor
    Write-Host "  Total Bins: $($dashboardResponse.data.totalBins)" -ForegroundColor $infoColor
    Write-Host "  Active Alerts: $($dashboardResponse.data.activeAlerts)" -ForegroundColor $infoColor
} catch {
    Write-Host "✗ Dashboard fetch failed: $($_.Exception.Message)" -ForegroundColor $errorColor
}

# ==================== ALERTS TESTS ====================
Write-Host "`n[5] ALERTS TESTS" -ForegroundColor $infoColor

# Get Alerts
Write-Host "`nFetching alerts..." -ForegroundColor $infoColor
try {
    $alertsResponse = Invoke-RestMethod -Uri "$baseUrl/alerts?page=1&limit=10" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $accessToken" }
    
    Write-Host "✓ Retrieved $($alertsResponse.data.Count) alerts" -ForegroundColor $successColor
    foreach ($alert in $alertsResponse.data) {
        Write-Host "  - $($alert.alertType) ($($alert.severity)): $($alert.message)" -ForegroundColor $infoColor
    }
} catch {
    Write-Host "✗ Failed to fetch alerts: $($_.Exception.Message)" -ForegroundColor $errorColor
}

# ==================== FEEDBACK TESTS ====================
Write-Host "`n[6] FEEDBACK TESTS" -ForegroundColor $infoColor

# Submit Feedback
Write-Host "`nSubmitting feedback..." -ForegroundColor $infoColor
$feedbackBody = @{
    category = "feature-request"
    rating = 5
    message = "Great system! Would love to see more real-time features."
    email = "user@example.com"
} | ConvertTo-Json

try {
    $feedbackResponse = Invoke-RestMethod -Uri "$baseUrl/feedback" `
        -Method POST `
        -ContentType "application/json" `
        -Body $feedbackBody
    
    Write-Host "✓ Feedback submitted successfully" -ForegroundColor $successColor
} catch {
    Write-Host "✗ Feedback submission failed: $($_.Exception.Message)" -ForegroundColor $errorColor
}

# ==================== CLEANUP ====================
Write-Host "`n[7] CLEANUP" -ForegroundColor $infoColor

# Delete Test Bins
foreach ($binId in $binIds) {
    Write-Host "`nDeleting bin: $binId..." -ForegroundColor $infoColor
    try {
        Invoke-RestMethod -Uri "$baseUrl/bins/$binId" `
            -Method DELETE `
            -Headers @{ Authorization = "Bearer $accessToken" } | Out-Null
        
        Write-Host "✓ Bin deleted" -ForegroundColor $successColor
    } catch {
        Write-Host "✗ Bin deletion failed: $($_.Exception.Message)" -ForegroundColor $errorColor
    }
}

Write-Host "`n========================================" -ForegroundColor $infoColor
Write-Host "Test Suite Completed" -ForegroundColor $infoColor
Write-Host "========================================" -ForegroundColor $infoColor
