# One-time project setup: Node.js, npm packages, VS Code extensions.
# Run via setup.cmd (double-click) or:
#   powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$answer = Read-Host 'This will setup the project by installing node.js and other extensions. Continue? (Y/n)'
if ($answer -match '^\s*n') {
    Write-Host 'Cancelled.'
    exit
}

$minNode = [version]'22.18.0'

function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path', 'User')
}

function Get-NodeVersion {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $null }
    return [version](node -v).TrimStart('v')
}

# --- Node.js (includes npm) ---
$nodeVersion = Get-NodeVersion
if ($null -eq $nodeVersion -or $nodeVersion -lt $minNode) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "winget not found. Install Node.js LTS (>= $minNode) from https://nodejs.org and re-run this script."
    }
    Write-Host 'Installing Node.js LTS...'
    winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
    Refresh-Path
    $nodeVersion = Get-NodeVersion
    if ($null -eq $nodeVersion -or $nodeVersion -lt $minNode) {
        throw "Node.js install finished but 'node' is missing or older than $minNode. Open a new terminal and re-run this script."
    }
}
Write-Host "Node $nodeVersion / npm $(npm -v)"

# --- Project dependencies ---
Write-Host 'Running npm install...'
npm install
if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }

# --- VS Code extensions from .vscode/extensions.json ---
if (-not (Get-Command code -ErrorAction SilentlyContinue)) {
    Write-Warning "VS Code 'code' command not found. Install VS Code (https://code.visualstudio.com), then re-run to install extensions."
} else {
    $extFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.vscode\extensions.json'
    if (Test-Path $extFile) {
        $recommendations = (Get-Content $extFile -Raw | ConvertFrom-Json).recommendations
        foreach ($ext in $recommendations) {
            Write-Host "Installing extension $ext..."
            code --install-extension $ext --force
        }
    }
}

Write-Host ''
Write-Host 'Setup complete. Open this folder in VS Code (File > Open Folder > vue-project) and allow automatic tasks to start the dev server.'
