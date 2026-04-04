$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$docSpecs = @(
  [ordered]@{ slug = "intro"; file = "docs/bcode-intro-v2.html"; display_title = "Intro"; preview_title = "bcode-intro-v2" }
  [ordered]@{ slug = "syntax"; file = "docs/bcode-syntax-v13.html"; display_title = "Syntax"; preview_title = "bcode-syntax-v13" }
  [ordered]@{ slug = "interpretation"; file = "docs/bcode-interpretation-v10.html"; display_title = "Interpretation"; preview_title = "bcode-interpretation-v10" }
  [ordered]@{ slug = "meta-v9"; file = "docs/bcode-meta-v9.html"; display_title = "BCODe.meta"; preview_title = "bcode-meta-v9" }
  [ordered]@{ slug = "meta-library-semantics"; file = "docs/bcode-meta-library-semantics-v9.html"; display_title = "BCODe.meta Library Semantics"; preview_title = "bcode-meta-library-semantics-v9" }
  [ordered]@{ slug = "rest"; file = "docs/bcode-rest-v6.1.3.html"; display_title = "BCODe.rest"; preview_title = "bcode-rest-v6.1.3" }
  [ordered]@{ slug = "best-practices"; file = "docs/bcode-best-practices-v13.html"; display_title = "Best Practices"; preview_title = "bcode-best-practices-v13" }
  [ordered]@{ slug = "telemetry-guide"; file = "docs/bcode-telemetry-guide.html"; display_title = "Telemetry Guide"; preview_title = "bcode-telemetry-guide" }
)

function Read-SourceText {
  param([string]$RelativePath)
  $path = Join-Path $root $RelativePath
  return Get-Content -LiteralPath $path -Raw
}

function Extract-MdSource {
  param([string]$Html)
  $match = [regex]::Match(
    $Html,
    '<script\s+id="md-source"\s+type="text/plain">([\s\S]*?)</script>',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
  if (-not $match.Success) {
    return ""
  }
  return $match.Groups[1].Value.Trim()
}

function Normalize-MarkdownText {
  param([string]$Text)
  $clean = [System.Net.WebUtility]::HtmlDecode([string]$Text)
  $clean = $clean -replace '<br\s*/?>', "`n"
  $clean = $clean -replace '</p\s*>', "`n`n"
  $clean = $clean -replace '<[^>]+>', ' '
  $clean = $clean -replace '```+', ''
  $clean = $clean -replace '\[([^\]]+)\]\([^)]+\)', '$1'
  $clean = $clean -replace '[*_`]', ''
  $clean = $clean -replace '\r', ''
  $clean = $clean -replace '\u00a0', ' '
  $clean = $clean -replace '\s+', ' '
  return $clean.Trim()
}

function Get-Slug {
  param([string]$Text)
  $slug = [string]$Text
  $slug = $slug.Trim()
  $slug = [regex]::Replace($slug, '^\s*\d+(?:\.\d+)*\s*[.\-:)]\s*', '')
  $slug = $slug.ToLowerInvariant()
  $slug = [regex]::Replace($slug, '[^\w\s-]+', '')
  $slug = $slug.Trim()
  $slug = [regex]::Replace($slug, '\s+', '-')
  if ([string]::IsNullOrWhiteSpace($slug)) {
    return "section"
  }
  return $slug
}

function Clean-HeadingLabel {
  param([string]$Text)
  $label = [string]$Text
  $label = $label.Trim()
  while ($label -match '^[^\w]*\d+(?:\.\d+)*(?:\s*[.)\-:])?\s+') {
    $label = [regex]::Replace($label, '^[^\w]*\d+(?:\.\d+)*(?:\s*[.)\-:])?\s+', '')
  }
  return ([regex]::Replace($label, '\s+', ' ')).Trim()
}

function New-Excerpt {
  param([string[]]$Lines)
  $excerptLines = New-Object System.Collections.Generic.List[string]
  foreach ($line in $Lines) {
    $trimmed = [string]$line
    if ([string]::IsNullOrWhiteSpace($trimmed)) {
      if ($excerptLines.Count -gt 0) { break }
      continue
    }
    $excerptLines.Add($trimmed)
  }
  $excerpt = Normalize-MarkdownText ($excerptLines -join "`n")
  if ($excerpt.Length -gt 320) {
    return ($excerpt.Substring(0, 317).TrimEnd() + "...")
  }
  return $excerpt
}

function Parse-Sections {
  param([string]$Markdown)

  $sections = New-Object System.Collections.Generic.List[object]
  $used = @{}
  $current = $null
  $inFence = $false
  $lines = $Markdown -split '\r?\n'

  foreach ($line in $lines) {
    if ($line -match '^\s*```') {
      $inFence = -not $inFence
      continue
    }

    if (-not $inFence -and $line -match '^(#{1,6})\s+(.+?)\s*$') {
      if ($null -ne $current) {
        $sections.Add([pscustomobject]@{
          level = $current.level
          text = $current.text
          number = $current.number
          label = $current.label
          id = $current.id
          excerpt = New-Excerpt $current.lines
        })
      }

      $headingText = $matches[2].Trim()
      $base = Get-Slug $headingText
      $count = 0
      if ($used.Contains($base)) {
        $count = [int]$used[$base]
      }
      $used[$base] = $count + 1
      $id = if ($used[$base] -eq 1) { $base } else { "$base-$($used[$base])" }

      $number = ""
      if ($headingText -match '^\s*(\d+(?:\.\d+)*)\s*[.\-:)]?\s+(.+?)\s*$') {
        $number = $matches[1]
      }

      $current = @{
        level = $matches[1].Length
        text = $headingText
        number = $number
        label = Clean-HeadingLabel $headingText
        id = $id
        lines = New-Object System.Collections.Generic.List[string]
      }
      continue
    }

    if ($null -ne $current) {
      $current.lines.Add($line)
    }
  }

  if ($null -ne $current) {
    $sections.Add([pscustomobject]@{
      level = $current.level
      text = $current.text
      number = $current.number
      label = $current.label
      id = $current.id
      excerpt = New-Excerpt $current.lines
    })
  }

  return $sections
}

$docs = New-Object System.Collections.Generic.List[object]
$readerSections = [ordered]@{}

foreach ($spec in $docSpecs) {
  $html = Read-SourceText $spec.file
  $md = Extract-MdSource $html
  $sections = Parse-Sections $md
  $bodySections = @($sections | Where-Object { $_.excerpt })
  $description = if ($bodySections.Count -gt 0) { $bodySections[0].excerpt } else { "" }
  $corpus = Normalize-MarkdownText $md

  $docs.Add([pscustomobject]@{
    slug = $spec.slug
    display_title = $spec.display_title
    preview_title = $spec.preview_title
    description = $description
    corpus_text = $corpus
  })

  $readerSections[$spec.slug] = @($sections)
}

$docsJson = $docs | ConvertTo-Json -Depth 8 -Compress
$sectionsJson = $readerSections | ConvertTo-Json -Depth 8 -Compress
$output = @"
window.__CODEX_DOCS_DATA__ = $docsJson;
window.__CODEX_READER_SECTIONS__ = $sectionsJson;
"@

[System.IO.File]::WriteAllText((Join-Path $root "assets/codex-docs-data.js"), $output, $utf8NoBom)
