Add-Type -AssemblyName System.IO.Compression.FileSystem

$filePath = "docs/Bora pro Jogo. Pesquisa sobre Conectividade e Esporte(1-31).xlsx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($filePath)

$sharedStrings = @()
$ssEntry = $zip.GetEntry("xl/sharedStrings.xml")
if ($ssEntry -ne $null) {
    $stream = $ssEntry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    [xml]$xml = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    $siNodes = $xml.SelectNodes("//x:si", $ns)
    foreach ($si in $siNodes) {
        $tNodes = $si.SelectNodes(".//x:t", $ns)
        $text = ($tNodes | ForEach-Object { $_.InnerText }) -join ""
        $sharedStrings += $text
    }
}

$sheetEntry = $zip.GetEntry("xl/worksheets/sheet1.xml")
$stream = $sheetEntry.Open()
$reader = New-Object System.IO.StreamReader($stream)
[xml]$sheetXml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

$ns = New-Object System.Xml.XmlNamespaceManager($sheetXml.NameTable)
$ns.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
$rows = $sheetXml.SelectNodes("//x:row", $ns)

$output = @()
foreach ($row in $rows) {
    $rowCells = @()
    $cells = $row.SelectNodes("x:c", $ns)
    foreach ($c in $cells) {
        $t = $c.GetAttribute("t")
        $vNode = $c.SelectSingleNode("x:v", $ns)
        $val = if ($vNode) { $vNode.InnerText } else { "" }
        if ($t -eq "s" -and $val -match "^\d+$") {
            $val = $sharedStrings[[int]$val]
        }
        $rowCells += $val
    }
    $output += ($rowCells -join " | ")
}

$output | Out-File -FilePath "docs/survey_extracted.txt" -Encoding utf8
Write-Output "Extracao concluida com $($output.Count) linhas."
