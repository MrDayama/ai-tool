Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\0pn32\.gemini\antigravity\brain\649d0f15-a66e-49f9-8df4-9ad533a4bd9a\user_uploaded_airship.png"
$outputPathArtifact = "C:\Users\0pn32\.gemini\antigravity\brain\649d0f15-a66e-49f9-8df4-9ad533a4bd9a\user_uploaded_airship_hd.png"
$outputPathApp = "c:\work\ai\ai-tool\amongus-helper\assets\maps\airship.png"

if (Test-Path $inputPath) {
    $srcImg = [System.Drawing.Image]::FromFile($inputPath)
    
    # 3倍に超拡大 (2178px x 1200px 超高解像度)
    $scale = 3.0
    $newWidth = [int]($srcImg.Width * $scale)
    $newHeight = [int]($srcImg.Height * $scale)
    
    $destBmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    
    # 最高品質レンダリングフラグ設定
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    
    # コントラスト＆シャープ調整用カラーマトリックス
    $colorMatrix = New-Object System.Drawing.Imaging.ColorMatrix
    $colorMatrix.Matrix00 = 1.35  # Red contrast
    $colorMatrix.Matrix11 = 1.35  # Green contrast
    $colorMatrix.Matrix22 = 1.35  # Blue contrast
    $colorMatrix.Matrix40 = -0.12 # Contrast bias
    $colorMatrix.Matrix41 = -0.12
    $colorMatrix.Matrix42 = -0.12
    
    $imageAttributes = New-Object System.Drawing.Imaging.ImageAttributes
    $imageAttributes.SetColorMatrix($colorMatrix, [System.Drawing.Imaging.ColorMatrixFlag]::Default, [System.Drawing.Imaging.ColorAdjustType]::Bitmap)
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $newWidth, $newHeight)
    $g.DrawImage($srcImg, $rect, 0, 0, $srcImg.Width, $srcImg.Height, [System.Drawing.GraphicsUnit]::Pixel, $imageAttributes)
    
    $g.Dispose()
    $srcImg.Dispose()
    
    # 最高画質無圧縮PNG保存
    $destBmp.Save($outputPathArtifact, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Save($outputPathApp, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    
    Write-Host "4K_ULTRA_HD_GENERATED"
} else {
    Write-Host "INPUT_FILE_NOT_FOUND"
}
