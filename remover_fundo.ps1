Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Devs-02\Desktop\BORA APP\BORA APP\client\src\assets\BoraLogo.png"
$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)
$target = New-Object System.Drawing.Bitmap $bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb

for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        $r = $pixel.R
        $g = $pixel.G
        $b = $pixel.B

        # Detecta o quadriculado cinza/branco falso (tons neutros próximos de cinza/branco)
        $isGreyChecker = ([Math]::Abs($r - $g) -lt 10) -and ([Math]::Abs($g - $b) -lt 10) -and ($r -gt 130)

        # Se não for parte das bolas/texto (que tem contornos azuis/amarelos bem definidos e estão no centro)
        # O quadriculado fica no fundo superior e inferior
        if ($isGreyChecker -and ($y -lt 300 -or $y -gt 720 -or $x -lt 40 -or $x -gt ($bmp.Width - 40))) {
            $target.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $target.SetPixel($x, $y, $pixel)
        }
    }
}

$bmp.Dispose()
$target.Save($sourcePath, [System.Drawing.Imaging.ImageFormat]::Png)
$target.Dispose()
Write-Host "Transparência processada com sucesso!"
