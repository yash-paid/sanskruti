Add-Type -AssemblyName System.Drawing
$srcPath = "ishika\public\logo.png"
$assetsDir = "ishikas-worldt-app\assets"

$src = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($img, $targetW, $targetH, $bgCol, $padPct, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    if ($bgCol) {
        $brush = New-Object System.Drawing.SolidBrush($bgCol)
        $g.FillRectangle($brush, 0, 0, $targetW, $targetH)
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }
    
    $padW = [int]($targetW * $padPct)
    $padH = [int]($targetH * $padPct)
    $drawW = $targetW - (2 * $padW)
    $drawH = $targetH - (2 * $padH)
    
    $g.DrawImage($img, $padW, $padH, $drawW, $drawH)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved $outPath"
}

# 1. Launcher icon 1024x1024
Resize-Image $src 1024 1024 ([System.Drawing.ColorTranslator]::FromHtml("#0a0a0f")) 0 "$assetsDir\icon.png"

# 2. Foreground 432x432 (18% padding for safe adaptive circle/squircle)
Resize-Image $src 432 432 $null 0.18 "$assetsDir\android-icon-foreground.png"

# 3. Background 432x432 solid #0a0a0f
$bgBmp = New-Object System.Drawing.Bitmap(432, 432)
$bgG = [System.Drawing.Graphics]::FromImage($bgBmp)
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#0a0a0f"))
$bgG.FillRectangle($bgBrush, 0, 0, 432, 432)
$bgG.Dispose()
$bgBrush.Dispose()
$bgBmp.Save("$assetsDir\android-icon-background.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bgBmp.Dispose()
Write-Output "Saved $assetsDir\android-icon-background.png"

# 4. Splash icon 400x400
Resize-Image $src 400 400 $null 0.05 "$assetsDir\splash-icon.png"

# 5. Notification icon 96x96
Resize-Image $src 96 96 $null 0.15 "$assetsDir\notification-icon.png"

$src.Dispose()
Write-Output "All branding icons generated successfully."
