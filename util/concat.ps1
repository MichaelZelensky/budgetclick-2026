# ########################################
#
# AI Development - Concat Files
#
# How to use:
#
# - Select files in VS Code
# - Right click -> Copy Relative Paths
# - Run this script
#
# Example:
#
# powershell.exe -NoProfile -ExecutionPolicy Bypass `
#   -File ./util/concat.ps1 `
#   -Constitution constitution-compressed.md `
#   -CodingInstructions coding-instructions.md `
#   -OutputFormat patch `
#   -MaxChars 120000
#
# ########################################

param(
    [string]$Constitution,
    [string]$CodingInstructions,

    [ValidateSet("patch", "full-code")]
    [string]$OutputFormat = "patch",

    [string]$OutDir = "$PSScriptRoot\concat-out",

    [int]$MaxChars = 0
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")

if (!(Test-Path $OutDir)) {
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
}

Get-ChildItem $OutDir -Filter "*.txt" | Remove-Item -Force

$clipboard = Get-Clipboard

$paths =
    $clipboard `
        -split "(`r`n|`n|`r)" |
        Where-Object { $_.Trim() -ne "" }

if ($paths.Count -eq 0) {
    Write-Host "Clipboard does not contain file paths."
    exit 1
}

$instructionFile =
    Join-Path `
        $PSScriptRoot `
        ("instructions/{0}.md" -f $OutputFormat)

function ReadText {
    param(
        [string]$Path
    )

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return ""
    }

    $fullPath =
        if ([System.IO.Path]::IsPathRooted($Path)) {
            $Path
        }
        else {
            Join-Path $root $Path
        }

    if (!(Test-Path -LiteralPath $fullPath)) {
        throw "File not found: $Path"
    }

    return Get-Content -LiteralPath $fullPath -Raw
}

function CreateHeader {
    $builder = New-Object System.Text.StringBuilder

    [void]$builder.AppendLine("You will receive the project split across multiple messages.")
    [void]$builder.AppendLine()
    [void]$builder.AppendLine("Do not produce any response until you receive:")
    [void]$builder.AppendLine()
    [void]$builder.AppendLine("===== END OF INPUT =====")
    [void]$builder.AppendLine()
    [void]$builder.AppendLine("Responding before that marker is incorrect.Just acknowledge the receipt of the input and wait for the next part.")
    [void]$builder.AppendLine()

    $instructionText = ReadText $instructionFile
    if ($instructionText.Length -gt 0) {
        [void]$builder.AppendLine($instructionText.TrimEnd())
        [void]$builder.AppendLine()
    }

    $codingInstructionsText = ReadText $CodingInstructions
    if ($codingInstructionsText.Length -gt 0) {
        [void]$builder.AppendLine($codingInstructionsText.TrimEnd())
        [void]$builder.AppendLine()
    }

    $constitutionText = ReadText $Constitution
    if ($constitutionText.Length -gt 0) {
        [void]$builder.AppendLine($constitutionText.TrimEnd())
        [void]$builder.AppendLine()
    }

    [void]$builder.AppendLine("===== INPUT PART 1 =====")
    [void]$builder.AppendLine()

    [void]$builder.AppendLine("** Files:")
    [void]$builder.AppendLine()

    return $builder
}

function CreateChunkBuilder {
    param(
        [int]$Index
    )

    $builder = New-Object System.Text.StringBuilder

    [void]$builder.AppendLine(("===== INPUT PART {0} =====" -f $Index))
    [void]$builder.AppendLine()
    [void]$builder.AppendLine("More parts will follow.")
    [void]$builder.AppendLine("Do not respond yet.")
    [void]$builder.AppendLine()

    [void]$builder.AppendLine("** Files:")
    [void]$builder.AppendLine()

    return $builder
}

function WriteChunk {
    param(
        [int]$Index,
        [System.Text.StringBuilder]$Builder,
        [bool]$IsLast
    )

    if ($IsLast) {
        [void]$Builder.AppendLine()
        [void]$Builder.AppendLine("===== END OF INPUT =====")
        [void]$Builder.AppendLine()
        [void]$Builder.AppendLine("You may now produce the requested output.")
    }

    $fileName = "{0:d3}.txt" -f $Index
    $filePath = Join-Path $OutDir $fileName

    [System.IO.File]::WriteAllText(
        $filePath,
        $Builder.ToString(),
        [System.Text.Encoding]::UTF8
    )

    Write-Host "Wrote $fileName"
}

$chunkIndex = 1
$builder = CreateHeader

foreach ($relativePath in $paths) {

    $relativePath = $relativePath.Trim()

    $fullPath = Join-Path $root $relativePath

    if (!(Test-Path -LiteralPath $fullPath)) {
        Write-Host "Skip (not found): $relativePath"
        continue
    }

    $item = Get-Item -LiteralPath $fullPath

    if ($item.PSIsContainer) {
        continue
    }

    try {
        $content = Get-Content -LiteralPath $fullPath -Raw

        $fileText =
@"

## $relativePath

$content

"@

        if (
            $MaxChars -gt 0 -and
            $builder.Length + $fileText.Length -gt $MaxChars
        ) {
            WriteChunk `
                -Index $chunkIndex `
                -Builder $builder `
                -IsLast $false

            $chunkIndex++

            $builder = CreateChunkBuilder $chunkIndex
        }

        [void]$builder.Append($fileText)
    }
    catch {
        Write-Host "Skip (read error): $relativePath"
    }
}

WriteChunk `
    -Index $chunkIndex `
    -Builder $builder `
    -IsLast $true

Write-Host ""
Write-Host "Done."