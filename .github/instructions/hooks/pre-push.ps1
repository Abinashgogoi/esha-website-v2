# pre-push.ps1
Get-ChildItem -Recurse -Path . -Include "*.html", "*.css", "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName
    $normalizedContent = $content -replace '\\', '/'
    $normalizedContent = $normalizedContent -replace '..\\', '../'
    $normalizedContent = $normalizedContent -replace '../\\', '../'
    Set-Content $_.FullName $normalizedContent
}
Write-Host "File paths normalized successfully."