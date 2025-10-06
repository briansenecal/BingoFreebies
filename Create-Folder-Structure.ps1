# Root path (adjust if not running from project root)
$basePath = "backend\app"

# Folder list
$folders = @(
    "$basePath\models",
    "$basePath\repositories",
    "$basePath\services",
    "$basePath\api\v1",
    "$basePath\utils",
    "backend\tests",
    "backend\migrations"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "Created: $folder"
    }
    else {
        Write-Host "Exists:  $folder"
    }
}

# Core files
$coreFiles = @(
    "backend\app\__init__.py",
    "backend\app\config.py",
    "backend\app\extensions.py",
    "backend\wsgi.py",
    "backend\requirements.txt",
    "backend\.env"
)

foreach ($file in $coreFiles) {
    if (-not (Test-Path $file)) {
        New-Item -ItemType File -Path $file | Out-Null
        Write-Host "Created: $file"
    }
    else {
        Write-Host "Exists:  $file"
    }
}

Write-Host "`n✅ Folder structure setup complete."
