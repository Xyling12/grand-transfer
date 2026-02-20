$exclude = @('node_modules', '.next', '.git', 'dist', 'coverage', '.vscode', '.idea')
$source = "d:\Antigravity\grand-transfer"
$destination = "d:\Antigravity\grand-transfer-clean.zip"

if (Test-Path $destination) { Remove-Item $destination }

Get-ChildItem $source -Exclude $exclude | Compress-Archive -DestinationPath $destination -Force
Write-Host "Created clean archive at $destination"
