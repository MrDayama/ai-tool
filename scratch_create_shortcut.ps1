$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$targetPath = Join-Path $desktop "Among Us Tactical Helper.url"
$content = @"
[InternetShortcut]
URL=file:///c:/work/ai/ai-tool/amongus-helper/index.html
IconIndex=14
IconFile=C:\Windows\System32\shell32.dll
"@

[System.IO.File]::WriteAllText($targetPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: Created shortcut at $targetPath"
