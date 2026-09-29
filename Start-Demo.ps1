param([int]$Port = 5080, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$demoDirectory = Join-Path $PSScriptRoot 'demo\windows'
$appPath = Join-Path $demoDirectory 'MarketHub.Api.exe'
$url = "http://127.0.0.1:$Port"
if (-not (Test-Path -LiteralPath $appPath)) { throw 'The Windows demo package is missing. See README.md to build from source.' }
try { $health = Invoke-RestMethod "$url/api/health" -TimeoutSec 2 } catch { $health = $null }
if ($health.service -eq 'MarketHub API') {
    Write-Host "MarketHub is already running at $url" -ForegroundColor Green
    if (-not $NoBrowser) { Start-Process $url }
    return
}
$logDirectory = Join-Path $PSScriptRoot 'demo\logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = $url
$env:PublicOrigin = $url
$env:Database__Provider = 'Sqlite'
$env:ConnectionStrings__Default = 'Data Source=App_Data/markethub.db'
$env:Payments__Provider = 'Demo'
$env:SeedDemoData = 'true'
$process = Start-Process -FilePath $appPath -WorkingDirectory $demoDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'server.log') -RedirectStandardError (Join-Path $logDirectory 'server-error.log')
$process.Id | Set-Content (Join-Path $PSScriptRoot 'demo\server.pid')
$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try {
        $health = Invoke-RestMethod "$url/api/health" -TimeoutSec 2
        if ($health.service -eq 'MarketHub API') { $ready = $true; break }
    } catch { Start-Sleep -Milliseconds 500 }
    if ($process.HasExited) { break }
}
if (-not $ready) { throw "MarketHub could not start. Check demo\logs\server-error.log and demo\logs\server.log. Port $Port may be occupied." }
Write-Host "MarketHub is ready: $url" -ForegroundColor Green
Write-Host 'Sign in using Customer, Vendor, or Admin on the demo login screen.'
Write-Host 'Everything runs locally. Payments are simulated; no real charges.'
if (-not $NoBrowser) { Start-Process $url }
