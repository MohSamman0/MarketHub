$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot 'demo\server.pid'
if (-not (Test-Path -LiteralPath $pidFile)) { Write-Host 'No launcher-managed process was found.'; return }
$demoProcessId = [int](Get-Content -LiteralPath $pidFile)
$expected = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'demo\windows\MarketHub.Api.exe'))
$process = Get-Process -Id $demoProcessId -ErrorAction SilentlyContinue
if ($process -and $process.Path -eq $expected) { Stop-Process -Id $demoProcessId; Write-Host 'MarketHub stopped. Your local database is preserved.' }
Remove-Item -LiteralPath $pidFile
