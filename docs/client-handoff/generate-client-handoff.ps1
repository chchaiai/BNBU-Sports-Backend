param(
    [string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$PackageDirectory = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path 'handoff\client-backend-integration-v1')
)

$ErrorActionPreference = 'Stop'
$ExpectedCommit = '61ec4c4a441f8a10a45de83cdce222b38f31ddaf'
$ExpectedBranch = 'docs/client-integration-staging-approval'
$ExpectedOpenApiHash = '1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c'
$PackageVersion = 'client-backend-integration-v1'

function Get-RelativeUnixPath {
    param([string]$BasePath, [string]$TargetPath)
    $normalizedBase = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\', '/')
    $normalizedTarget = [System.IO.Path]::GetFullPath($TargetPath)
    if (-not $normalizedTarget.StartsWith("$normalizedBase\", [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Target is outside package directory: $normalizedTarget"
    }
    return $normalizedTarget.Substring($normalizedBase.Length + 1).Replace('\', '/')
}

function Get-LowerSha256 {
    param([string]$Path)
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Convert-ToLfUtf8NoBom {
    param([string]$Path)
    $content = [System.IO.File]::ReadAllText($Path)
    $normalized = $content.Replace("`r`n", "`n").Replace("`r", "`n")
    [System.IO.File]::WriteAllText(
        $Path,
        $normalized,
        [System.Text.UTF8Encoding]::new($false)
    )
}

function Copy-PackageFile {
    param([string]$Source, [string]$Destination)
    $parent = Split-Path -Parent $Destination
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Copy-Item -LiteralPath $Source -Destination $Destination
}

Set-Location $RepositoryRoot

$actualCommit = (git rev-parse HEAD).Trim()
$actualBranch = (git branch --show-current).Trim()
git merge-base --is-ancestor $ExpectedCommit $actualCommit
if ($LASTEXITCODE -ne 0) {
    throw "Frozen source commit is not an ancestor of HEAD: source $ExpectedCommit, HEAD $actualCommit"
}
if ($actualBranch -ne $ExpectedBranch) {
    throw "Source branch mismatch: expected $ExpectedBranch, actual $actualBranch"
}
if (Test-Path -LiteralPath $PackageDirectory) {
    throw "Package directory already exists: $PackageDirectory"
}

$openApiSource = Join-Path $RepositoryRoot 'docs\backend-contracts\openapi.yaml'
$actualOpenApiHash = Get-LowerSha256 $openApiSource
if ($actualOpenApiHash -ne $ExpectedOpenApiHash) {
    throw "OpenAPI SHA-256 mismatch: expected $ExpectedOpenApiHash, actual $actualOpenApiHash"
}

$runtimeManifestPath = Join-Path $RepositoryRoot 'backend\runtime-coverage.manifest.json'
$runtimeManifest = Get-Content -LiteralPath $runtimeManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$defaultDeny = @($runtimeManifest.implementedDefaultDeny)
$implementedCount = @($runtimeManifest.implemented.PSObject.Properties).Count
$runtimeSummary = [ordered]@{
    openapiOperations = [int]$runtimeManifest.expectedOperationCount
    implementedVerified = $implementedCount - $defaultDeny.Count
    implementedDefaultDeny = $defaultDeny.Count
    notImplemented = 0
    blockedByAdr = 0
    exportBusinessGate = $false
    stagingRuntimeReadiness = $false
    clientIntegrationStarted = $false
    fullProductionGate = $false
}
if ($runtimeSummary.openapiOperations -ne 92 -or $runtimeSummary.implementedVerified -ne 82 -or $runtimeSummary.implementedDefaultDeny -ne 10) {
    throw "Unexpected runtime coverage: $($runtimeSummary | ConvertTo-Json -Compress)"
}

$directories = @('00-contract', '01-shared', '02-android', '03-ios', '04-web', '05-manager')
New-Item -ItemType Directory -Path $PackageDirectory | Out-Null
foreach ($directory in $directories) {
    New-Item -ItemType Directory -Path (Join-Path $PackageDirectory $directory) | Out-Null
}

# The distribution snapshot is byte-addressed by its Manifest. Disable Git text
# normalization for this directory so a future Windows checkout cannot change
# line endings and invalidate the recorded SHA-256 values.
'* -text' | Set-Content -LiteralPath (Join-Path $PackageDirectory '.gitattributes') -Encoding ASCII

$sourceRoot = Join-Path $RepositoryRoot 'docs\client-handoff'
Copy-PackageFile (Join-Path $sourceRoot 'README-FIRST.md') (Join-Path $PackageDirectory 'README-FIRST.md')
foreach ($directory in $directories) {
    $sourceDirectory = Join-Path $sourceRoot $directory
    if (-not (Test-Path -LiteralPath $sourceDirectory)) { continue }
    Get-ChildItem -LiteralPath $sourceDirectory -File | ForEach-Object {
        Copy-PackageFile $_.FullName (Join-Path (Join-Path $PackageDirectory $directory) $_.Name)
    }
}

Copy-PackageFile $openApiSource (Join-Path $PackageDirectory '00-contract\openapi.snapshot.yaml')
Copy-PackageFile (Join-Path $RepositoryRoot 'docs\backend-contracts\20b-client-contract-baseline.json') (Join-Path $PackageDirectory '00-contract\client-contract-baseline.json')
Copy-PackageFile (Join-Path $RepositoryRoot 'docs\backend-contracts\20-client-integration-contract-pack.md') (Join-Path $PackageDirectory '00-contract\client-integration-contract-pack.md')
Copy-PackageFile (Join-Path $RepositoryRoot 'docs\backend-contracts\20-client-integration-approval-template.md') (Join-Path $PackageDirectory '00-contract\client-integration-approval.md')
Copy-PackageFile (Join-Path $RepositoryRoot 'docs\backend-contracts\20-client-contract-gap-inventory.md') (Join-Path $PackageDirectory '00-contract\client-contract-gap-inventory.md')

$runtimeSummary | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PackageDirectory '00-contract\runtime-coverage-summary.json') -Encoding UTF8

@"
Authoritative source:
docs/backend-contracts/openapi.yaml

Source commit:
$ExpectedCommit

SHA-256:
$ExpectedOpenApiHash

Operation count:
92
"@ | Set-Content -LiteralPath (Join-Path $PackageDirectory '00-contract\openapi.sha256.txt') -Encoding UTF8

@"
Package version: $PackageVersion
Source branch: $ExpectedBranch
Source commit: $ExpectedCommit
OpenAPI source: docs/backend-contracts/openapi.yaml
OpenAPI SHA-256: $ExpectedOpenApiHash
OpenAPI operations: 92
"@ | Set-Content -LiteralPath (Join-Path $PackageDirectory 'SOURCE-COMMIT.txt') -Encoding UTF8

$generatedAt = (Get-Date).ToUniversalTime().ToString('o')
@"
# Generation Report

- Package version: $PackageVersion
- Generated at: $generatedAt
- Source branch: $ExpectedBranch
- Source commit: $ExpectedCommit
- OpenAPI SHA-256: $ExpectedOpenApiHash
- Runtime coverage: 92 operations / 82 verified / 10 default-deny / 0 not implemented / 0 blocked
- iOS project present: NO
- iOS project path: NONE
- iOS project import required: YES
- Local seed gap: NO
- Android/Web/iOS handoff documents ready: YES / YES / YES
- Client integration started: NO
- Staging runtime readiness: NO
- Export implementation started: NO
- Production deployment started: NO

## ZIP metadata

The final ZIP path, byte size, and SHA-256 are written after archive creation to the adjacent `.zip.sha256` sidecar and to `docs/backend-contracts/CURRENT-HANDOFF.md`. A ZIP cannot contain its own final cryptographic digest without changing that digest; this report therefore records the verification location instead of an unverifiable self-reference.

Expected ZIP path: `C:\Users\23328\Desktop\BNBU-Sports-client-backend-handoff-v1.zip`

## Integrity semantics

`PACKAGE-MANIFEST.json` lists every payload file, but does not list itself or `PACKAGE-CHECKSUMS.sha256`; otherwise a self-hash would be recursive. `PACKAGE-CHECKSUMS.sha256` hashes every package file except itself, including the Manifest. The final ZIP receives its own external SHA-256 sidecar.
"@ | Set-Content -LiteralPath (Join-Path $PackageDirectory 'GENERATION-REPORT.md') -Encoding UTF8

@(
    '.gitattributes',
    '00-contract/openapi.sha256.txt',
    '00-contract/runtime-coverage-summary.json',
    'SOURCE-COMMIT.txt',
    'GENERATION-REPORT.md'
) | ForEach-Object {
    Convert-ToLfUtf8NoBom (Join-Path $PackageDirectory $_.Replace('/', '\'))
}

function Get-RoleForPath {
    param([string]$RelativePath)
    if ($RelativePath -eq '00-contract/openapi.snapshot.yaml') { return 'machine-contract' }
    if ($RelativePath.StartsWith('00-contract/')) { return 'contract-evidence' }
    if ($RelativePath.StartsWith('01-shared/')) { return 'shared-guide' }
    if ($RelativePath.StartsWith('02-android/')) { return 'android-task' }
    if ($RelativePath.StartsWith('03-ios/')) { return 'ios-task' }
    if ($RelativePath.StartsWith('04-web/')) { return 'web-task' }
    if ($RelativePath.StartsWith('05-manager/')) { return 'manager-template' }
    return 'package-metadata'
}

function Get-RequiredForPath {
    param([string]$RelativePath)
    if ($RelativePath.StartsWith('02-android/')) { return @('android') }
    if ($RelativePath.StartsWith('03-ios/')) { return @('ios') }
    if ($RelativePath.StartsWith('04-web/')) { return @('web') }
    if ($RelativePath.StartsWith('05-manager/')) { return @('manager') }
    return @('android', 'ios', 'web')
}

$sourcePathMap = @{
    '.gitattributes' = 'docs/client-handoff/generate-client-handoff.ps1'
    '00-contract/openapi.snapshot.yaml' = 'docs/backend-contracts/openapi.yaml'
    '00-contract/openapi.sha256.txt' = 'docs/backend-contracts/openapi.yaml'
    '00-contract/client-contract-baseline.json' = 'docs/backend-contracts/20b-client-contract-baseline.json'
    '00-contract/client-integration-contract-pack.md' = 'docs/backend-contracts/20-client-integration-contract-pack.md'
    '00-contract/client-integration-approval.md' = 'docs/backend-contracts/20-client-integration-approval-template.md'
    '00-contract/client-contract-gap-inventory.md' = 'docs/backend-contracts/20-client-contract-gap-inventory.md'
    '00-contract/runtime-coverage-summary.json' = 'backend/runtime-coverage.manifest.json'
    'SOURCE-COMMIT.txt' = 'git:HEAD'
    'GENERATION-REPORT.md' = 'docs/client-handoff/generate-client-handoff.ps1'
}

$payloadFiles = Get-ChildItem -LiteralPath $PackageDirectory -Recurse -File |
    Where-Object { $_.Name -notin @('PACKAGE-MANIFEST.json', 'PACKAGE-CHECKSUMS.sha256') } |
    Sort-Object FullName

$manifestFiles = foreach ($file in $payloadFiles) {
    $relativePath = Get-RelativeUnixPath $PackageDirectory $file.FullName
    $sourcePath = $sourcePathMap[$relativePath]
    if ($null -eq $sourcePath -and $relativePath -eq 'README-FIRST.md') {
        $sourcePath = 'docs/client-handoff/README-FIRST.md'
    } elseif ($null -eq $sourcePath -and $relativePath -match '^(00-contract/CONTRACT-READ-ME.md|0[1-5]-[^/]+/.+)$') {
        $sourcePath = "docs/client-handoff/$relativePath"
    }
    [ordered]@{
        path = $relativePath
        sourcePath = $sourcePath
        sha256 = Get-LowerSha256 $file.FullName
        sizeBytes = [long]$file.Length
        role = Get-RoleForPath $relativePath
        mutable = $false
        requiredFor = @(Get-RequiredForPath $relativePath)
    }
}

$manifest = [ordered]@{
    packageVersion = $PackageVersion
    generatedAt = $generatedAt
    sourceCommit = $ExpectedCommit
    openApiSha256 = $ExpectedOpenApiHash
    openApiOperations = 92
    iosProjectPresent = $false
    integrityExclusions = @('PACKAGE-MANIFEST.json', 'PACKAGE-CHECKSUMS.sha256')
    files = @($manifestFiles)
}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PackageDirectory 'PACKAGE-MANIFEST.json') -Encoding UTF8
Convert-ToLfUtf8NoBom (Join-Path $PackageDirectory 'PACKAGE-MANIFEST.json')

$checksumLines = Get-ChildItem -LiteralPath $PackageDirectory -Recurse -File |
    Where-Object { $_.Name -ne 'PACKAGE-CHECKSUMS.sha256' } |
    Sort-Object FullName |
    ForEach-Object {
        $relativePath = Get-RelativeUnixPath $PackageDirectory $_.FullName
        "$(Get-LowerSha256 $_.FullName)  $relativePath"
    }
$checksumLines | Set-Content -LiteralPath (Join-Path $PackageDirectory 'PACKAGE-CHECKSUMS.sha256') -Encoding ASCII
Convert-ToLfUtf8NoBom (Join-Path $PackageDirectory 'PACKAGE-CHECKSUMS.sha256')

[pscustomobject]@{
    PackageDirectory = $PackageDirectory
    SourceCommit = $ExpectedCommit
    GenerationHead = $actualCommit
    OpenApiSha256 = $actualOpenApiHash
    ManifestEntries = $manifestFiles.Count
    PackageFiles = (Get-ChildItem -LiteralPath $PackageDirectory -Recurse -File).Count
    GeneratedAt = $generatedAt
}
