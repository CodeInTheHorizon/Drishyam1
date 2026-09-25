$zipFile = "ksp-crime-intelligence-platform.zip"
$clientZip = "client-deploy.zip"

if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
if (Test-Path $clientZip) { Remove-Item $clientZip -Force }

# Create full project deployment zip (excluding node_modules, .git)
$tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "ksp_deploy_" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy project files using robocopy
& robocopy . $tempDir /E /XD "node_modules" ".git" ".gemini" "dist" /XF "*.zip" /NFL /NDL /NJH /NJS

# Compress to deployment zip
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -CompressionLevel Optimal -Force

# Also package frontend client dist for Catalyst / web client deployment
Compress-Archive -Path "frontend\dist\*" -DestinationPath $clientZip -CompressionLevel Optimal -Force

# Clean up temporary dir
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Deployment zip files created successfully:"
Get-Item $zipFile, $clientZip | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
