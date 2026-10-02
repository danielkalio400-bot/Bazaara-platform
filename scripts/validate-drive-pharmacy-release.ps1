$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Run-Step([string]$Title, [scriptblock]$Command) {
    Write-Host "`n=== $Title ===" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Title failed with exit code $LASTEXITCODE"
    }
}

Run-Step "Prisma schema validation" { npm run db:validate }
Run-Step "Prisma client generation" { npm run db:generate }
Run-Step "Static platform validation" { npm run validate:static }
Run-Step "Grocery/Food regression validation" { npm run validate:grocery-food-v2 }
Run-Step "Drive/Pharmacy frozen-rule validation" { npm run validate:drive-pharmacy }
Run-Step "Workspace TypeScript typecheck" { npm run typecheck }
Run-Step "Automated tests" { npm test }
Run-Step "Web production builds" { npm run build:web }

Write-Host "`nDRIVE + PHARMACY RELEASE VALIDATION PASSED" -ForegroundColor Green
