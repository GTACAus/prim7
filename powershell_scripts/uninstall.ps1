# Undo setup.ps1: removes node_modules, the VS Code extensions and Node.js.
# Run via uninstall_all.cmd (double-click) or:
#   powershell -ExecutionPolicy Bypass -File powershell_scripts\uninstall.ps1

# Project root is the folder above powershell_scripts
Set-Location (Split-Path $PSScriptRoot -Parent)

$answer = Read-Host 'This will remove node_modules, the VS Code extensions and Node.js. Continue? (Y/n)'
if ($answer -match '^\s*n') {
    Write-Host 'Cancelled.'
    exit
}

Write-Host 'Removing node_modules...'
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

Write-Host 'Uninstalling VS Code extensions...'
code --uninstall-extension seunlanlege.action-buttons
code --uninstall-extension Vue.volar
code --uninstall-extension ryuta46.multi-command

Write-Host 'Uninstalling Node.js...'
winget uninstall --id OpenJS.NodeJS.LTS -e

Write-Host 'Done.'
