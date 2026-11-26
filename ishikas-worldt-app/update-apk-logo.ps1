Add-Type -AssemblyName System.Drawing
$srcPath = "d:\Projects\Sanskruti - Ebook\ishika\src\app\cart\apk logo.png"
$assetsDir = "d:\Projects\Sanskruti - Ebook\ishikas-worldt-app\assets"
$resDir = "d:\Projects\Sanskruti - Ebook\ishikas-worldt-app\android\app\src\main\res"

Copy-Item $srcPath "$assetsDir\apk-logo.png" -Force

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

# 1. Expo Assets
Resize-Image $src 1024 1024 ([System.Drawing.ColorTranslator]::FromHtml("#0a0a0f")) 0 "$assetsDir\icon.png"
Resize-Image $src 432 432 $null 0.15 "$assetsDir\android-icon-foreground.png"
Resize-Image $src 400 400 $null 0.05 "$assetsDir\splash-icon.png"
Resize-Image $src 96 96 $null 0.15 "$assetsDir\notification-icon.png"

# 2. Android Native Res Icons
$densities = @{
    "mdpi" = @{ size = 48; fgSize = 108 }
    "hdpi" = @{ size = 72; fgSize = 162 }
    "xhdpi" = @{ size = 96; fgSize = 216 }
    "xxhdpi" = @{ size = 144; fgSize = 324 }
    "xxxhdpi" = @{ size = 192; fgSize = 432 }
}

foreach ($d in $densities.Keys) {
    $folder = "$resDir\mipmap-$d"
    if (Test-Path $folder) {
        $sz = $densities[$d].size
        $fgSz = $densities[$d].fgSize
        Resize-Image $src $sz $sz ([System.Drawing.ColorTranslator]::FromHtml("#0a0a0f")) 0.05 "$folder\ic_launcher.png"
        Resize-Image $src $sz $sz ([System.Drawing.ColorTranslator]::FromHtml("#0a0a0f")) 0.05 "$folder\ic_launcher_round.png"
        Resize-Image $src $fgSz $fgSz $null 0.15 "$folder\ic_launcher_foreground.png"
    }
}

$splashFolders = @("drawable-mdpi", "drawable-hdpi", "drawable-xhdpi", "drawable-xxhdpi", "drawable-xxxhdpi")
foreach ($sf in $splashFolders) {
    $folder = "$resDir\$sf"
    if (Test-Path $folder) {
        Resize-Image $src 400 400 $null 0.05 "$folder\splashscreen_logo.png"
    }
}

$src.Dispose()
Write-Output "All APK icons updated with new 'apk logo.png' successfully!"
