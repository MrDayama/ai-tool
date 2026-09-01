$targetDir = "C:\work\ai\ai-tool\amongus-helper\assets\maps"
if (-not (Test-Path -Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
}

$mapUrls = @{
    "skeld.png" = "https://cdn.gamerch.com/contents/wiki/1792/entry/SYTl9lsp.png"
    "mira.png"  = "https://cdn.gamerch.com/contents/wiki/1792/entry/RHohkdHP.png"
    "polus.png" = "https://cdn.gamerch.com/contents/wiki/1792/entry/g7cEAiwK.png"
    "airship.png" = "https://cdn.gamerch.com/contents/wiki/1792/entry/rg39qQ9T.png"
    "fungle.png" = "https://cdn.gamerch.com/contents/wiki/1792/entry/i7gGzsz8.png"
}

foreach ($fileName in $mapUrls.Keys) {
    $url = $mapUrls[$fileName]
    $filePath = Join-Path -Path $targetDir -ChildPath $fileName
    Write-Host "Downloading $fileName..."
    Invoke-WebRequest -Uri $url -OutFile $filePath -UserAgent "Mozilla/5.0"
}
Write-Host "ALL_DOWNLOADS_COMPLETE"
