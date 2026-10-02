[CmdletBinding()]
param(
    [string]$ApiBase = "http://localhost:4000",
    [string]$ShoppingBase = "http://localhost:3003",
    [string]$FoodBase = "http://localhost:3007",
    [switch]$ExerciseCarts,
    [switch]$ExerciseLogin,
    [switch]$ExerciseCheckout,
    [switch]$PlaceDemoOrders,
    [string]$TestEmail = "",
    [SecureString]$TestPassword,
    [string]$OrderConfirmation = ""
)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

foreach ($base in @($ApiBase,$ShoppingBase,$FoodBase)) {
    $uri = [Uri]$base
    if ($uri.Scheme -ne "http" -or $uri.Host -notin @("localhost","127.0.0.1","[::1]")) {
        throw "V15 smoke tests may only target HTTP services on localhost. Refused: $base"
    }
}
if ($ExerciseCheckout -and (-not $ExerciseLogin -or -not $ExerciseCarts)) {
    throw "ExerciseCheckout requires -ExerciseCarts and -ExerciseLogin."
}
if ($PlaceDemoOrders -and (-not $ExerciseCheckout -or $OrderConfirmation -ne "DEMO_ORDERS_ONLY")) {
    throw "Demo orders require -ExerciseCarts -ExerciseLogin -ExerciseCheckout -PlaceDemoOrders -OrderConfirmation DEMO_ORDERS_ONLY."
}
if ($ExerciseLogin -and -not $TestEmail) {
    $TestEmail = Read-Host "Enter the email of a DEDICATED LOCAL TEST USER (not your real customer account)"
}
if ($ExerciseLogin -and -not $TestPassword) {
    $TestPassword = Read-Host "Local test account password" -AsSecureString
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$script:passed = 0
$script:failed = 0
$results = New-Object System.Collections.Generic.List[object]
$reportDir = Join-Path $env:TEMP "bazaara-v15-smoke-results"
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null

function Record([string]$Name,[bool]$Good,[string]$Details) {
    $label = if ($Good) { "PASS" } else { "FAIL" }
    if ($Good) { $script:passed++; Write-Host "PASS $Name" -ForegroundColor Green }
    else { $script:failed++; Write-Host "FAIL $Name : $Details" -ForegroundColor Red }
    $results.Add([pscustomobject]@{Test=$Name;Status=$label;Details=$Details})
    if (-not $Good) { throw "Smoke test failed: $Name - $Details" }
}
function Check([string]$Name,[bool]$Condition,[string]$Message="") { Record $Name $Condition $Message }
function Api([string]$Method,[string]$Path,[object]$Payload=$null,[hashtable]$Headers=@{}) {
    # BAZAARA_V15_SMOKE_ORIGIN_FIX
    # Simulate an approved local browser for authenticated mutations.
    if ($Method -in @("POST", "PUT", "PATCH", "DELETE")) {
        $Headers["Origin"] = if ($Path.StartsWith("/v1/food/")) {
            $FoodBase.TrimEnd("/")
        } else {
            $ShoppingBase.TrimEnd("/")
        }
    }

    $args = @{ Uri = "$($ApiBase.TrimEnd('/'))$Path"; Method = $Method; WebSession = $session; ErrorAction = "Stop"; TimeoutSec = 25; Headers = $Headers }
    if ($null -ne $Payload) {
        $args["ContentType"] = "application/json"
        $args["Body"] = ConvertTo-Json -InputObject $Payload -Depth 16 -Compress
    }
    try {
    try {
    try {
    try {
    return Invoke-RestMethod @args
}
catch {
    $Status = if ($_.Exception.Response) {
        [int]$_.Exception.Response.StatusCode
    } else {
        "Unknown"
    }

    Write-Host "FAILED API: $Method $Path - HTTP $Status" `
        -ForegroundColor Red
    throw
}
}
catch {
    $Status = if ($_.Exception.Response) {
        [int]$_.Exception.Response.StatusCode
    } else {
        "Unknown"
    }

    Write-Host "FAILED API: $Method $Path - HTTP $Status" `
        -ForegroundColor Red
    throw
}
}
catch {
    $Status = if ($_.Exception.Response) {
        [int]$_.Exception.Response.StatusCode
    } else {
        "Unknown"
    }

    Write-Host "FAILED API: $Method $Path - HTTP $Status" `
        -ForegroundColor Red
    throw
}
}
catch {
    $Status = if ($_.Exception.Response) {
        [int]$_.Exception.Response.StatusCode
    } else {
        "Unknown"
    }

    Write-Host "FAILED API: $Method $Path - HTTP $Status" `
        -ForegroundColor Red
    throw
}
}
function UrlCheck([string]$Name,[string]$Url) {
    $result = Invoke-WebRequest -Uri $Url -UseBasicParsing -MaximumRedirection 4 -TimeoutSec 30 -ErrorAction Stop
    Check $Name ($result.StatusCode -eq 200) "HTTP $($result.StatusCode)"
}
function FindDemoShoppingItem($Category) {
    $encoded = [Uri]::EscapeDataString($Category.slug)
    $list = Api "GET" "/v1/shopping/products?category=$encoded&vertical=SHOPPING&limit=48"
    $items = @($list.products | Where-Object { $_.slug -like 'bazaara-v15-demo-*' -and $_.stock -eq "IN_STOCK" })
    Check "Shopping category: $($Category.name)" ($items.Count -gt 0) "No in-stock V15 demo product in $($Category.slug). Run the local V15 demo seed."
    return $items[0]
}
function GuestCartChecks($shopItem,$foodItem) {
    $variantId = [string]$shopItem.defaultVariantId
    Check "Shopping demo variant" (-not [string]::IsNullOrEmpty($variantId)) "Missing defaultVariantId"
    $cart = (Api "POST" "/v1/shopping/cart/items" @{ variantId = $variantId; quantity = 1 }).cart
    $item = @($cart.items | Where-Object { $_.variant.id -eq $variantId }) | Select-Object -First 1
    Check "Guest Shopping add to cart" ($null -ne $item) "Expected demo item not added"
    $cart = (Api "PATCH" "/v1/shopping/cart/items/$($item.id)" @{ quantity = 2 }).cart
    $item = @($cart.items | Where-Object { $_.variant.id -eq $variantId }) | Select-Object -First 1
    Check "Guest Shopping quantity 2" ($null -ne $item -and $item.quantity -eq 2) "Quantity failed to persist"
    if (-not $ExerciseLogin) {
        $cart = (Api "DELETE" "/v1/shopping/cart/items/$($item.id)").cart
        Check "Guest Shopping remove" (@($cart.items | Where-Object { $_.variant.id -eq $variantId }).Count -eq 0) "Remove failed"
    }
    $slug = "bazaara-v15-demo-food"
    $cart = (Api "POST" "/v1/food/restaurants/$slug/cart/items" @{ menuItemId=[string]$foodItem.id; quantity=1; optionIds=@() }).cart
    $foodCartItem = @($cart.items | Where-Object { $_.menuItemId -eq $foodItem.id }) | Select-Object -First 1
    Check "Guest Food add to cart" ($null -ne $foodCartItem) "Food cart add failed"
    $cart = (Api "PATCH" "/v1/food/restaurants/$slug/cart/items/$($foodCartItem.id)" @{ quantity=2 }).cart
    $foodCartItem = @($cart.items | Where-Object { $_.menuItemId -eq $foodItem.id }) | Select-Object -First 1
    Check "Guest Food quantity 2" ($null -ne $foodCartItem -and $foodCartItem.quantity -eq 2) "Food quantity failed to persist"
    if (-not $ExerciseLogin) {
        $cart = (Api "DELETE" "/v1/food/restaurants/$slug/cart/items/$($foodCartItem.id)").cart
        Check "Guest Food remove" (@($cart.items | Where-Object { $_.menuItemId -eq $foodItem.id }).Count -eq 0) "Food item removal failed"
    }
}
function LoginChecks($shopItem) {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($TestPassword)
    try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    try { $result = Api "POST" "/v1/bazid/login/email" @{email=$TestEmail;password=$password} }
    finally { $password = $null }
    Check "BazID email login" (-not [string]::IsNullOrEmpty([string]$result.user.id)) "No user ID returned"
    $me=Api "GET" "/v1/bazid/me"
    Check "BazID authenticated profile" ($me.user.id -eq $result.user.id) "Session not persisted"
    $saved = Api "PUT" "/v1/shopping/wishlist/$($shopItem.id)?vertical=SHOPPING" @{variantId=$shopItem.defaultVariantId}
    Check "Shopping wishlist add" (@($saved.products | Where-Object { $_.id -eq $shopItem.id }).Count -gt 0) "Wishlist add failed"
    $listing = Api "GET" "/v1/shopping/wishlist?vertical=SHOPPING"
    Check "Shopping wishlist persists" (@($listing.products | Where-Object { $_.id -eq $shopItem.id }).Count -gt 0) "Wishlist not returned"
    $null = Api "DELETE" "/v1/shopping/wishlist/$($shopItem.id)?vertical=SHOPPING"
    Check "Shopping wishlist remove" (@((Api "GET" "/v1/shopping/wishlist?vertical=SHOPPING").products | Where-Object { $_.id -eq $shopItem.id }).Count -eq 0) "Wishlist remove failed"
    $fav = Api "PUT" "/v1/food/restaurants/bazaara-v15-demo-food/favorite" @{saved=$true}
    $favorites = Api "GET" "/v1/food/favorites"
    Check "Food favourites accessible" ($null -ne $favorites) "Food favourites query failed"
    $null = Api "PUT" "/v1/food/restaurants/bazaara-v15-demo-food/favorite" @{saved=$false}
    $null = Api "GET" "/v1/shopping/orders"
    Check "Shopping order history endpoint" $true "Authenticated 200 response, including an empty history"
    $null = Api "GET" "/v1/food/orders"
    Check "Food order history endpoint" $true "Authenticated 200 response, including an empty history"
    if ($ExerciseCarts) {
        $cart = (Api "GET" "/v1/shopping/cart").cart
        Check "Shopping guest cart merges into BazID" ($cart.itemCount -ge 2) "Expected guest items after login"
        $cart = (Api "GET" "/v1/food/restaurants/bazaara-v15-demo-food/cart").cart
        Check "Food guest cart merges into BazID" ($cart.items.Count -gt 0) "Food guest items missing after login"
    }
}
function CleanupDemoCarts($shopItem,$foodItem) {
    $shoppingCart=(Api "GET" "/v1/shopping/cart").cart
    foreach($item in @($shoppingCart.items | Where-Object { $_.product.slug -eq $shopItem.slug })) {
        $null=Api "DELETE" "/v1/shopping/cart/items/$($item.id)"
    }
    $foodCart=(Api "GET" "/v1/food/restaurants/bazaara-v15-demo-food/cart").cart
    foreach($item in @($foodCart.items | Where-Object { $_.menuItemId -eq $foodItem.id })) {
        $null=Api "DELETE" "/v1/food/restaurants/bazaara-v15-demo-food/cart/items/$($item.id)"
    }
    Check "Demo carts cleaned after login" $true ""
}
function CheckoutChecks($shopItem,$foodItem) {
    $checkout = (Api "POST" "/v1/shopping/checkouts" @{ shippingAddress = @{fullName="BAZAARA LOCAL DEMO";phone="08000000000";country="NG";region="Rivers";city="Port Harcourt";street="LOCAL TEST ONLY — DO NOT DELIVER"};deliveryMode="STANDARD" }).checkout
    Check "Shopping checkout created" (-not [string]::IsNullOrEmpty([string]$checkout.id)) "Checkout was not created"
    $retrieved = (Api "GET" "/v1/shopping/checkouts/$($checkout.id)").checkout
    Check "Shopping checkout retrieval" ($retrieved.id -eq $checkout.id) "Checkout retrieval mismatch"
    $checkout = (Api "PATCH" "/v1/shopping/checkouts/$($checkout.id)/payment-method" @{ paymentMethod="PAY_ON_DELIVERY" }).checkout
    Check "Shopping test payment method" ($checkout.paymentMethod -eq "PAY_ON_DELIVERY") "Payment method update failed"
    if (-not $PlaceDemoOrders) {
        Write-Host "DRY RUN: checkout created. No order was submitted. Its inventory reservation will expire normally." -ForegroundColor Yellow
        return
    }
    $key = "bazaara-v15-" + [guid]::NewGuid().ToString("N")
    $first = (Api "POST" "/v1/shopping/checkouts/$($checkout.id)/place-order" @{} @{ "Idempotency-Key"=$key }).order
    Check "Shopping DEMO pay-on-delivery order" (-not [string]::IsNullOrEmpty([string]$first.id)) "Demo order not created"
    $again = (Api "POST" "/v1/shopping/checkouts/$($checkout.id)/place-order" @{} @{ "Idempotency-Key"=$key }).order
    Check "Shopping order idempotency" ($again.id -eq $first.id) "Duplicate request changed the order ID"
    $retrieved = (Api "GET" "/v1/shopping/orders/$($first.id)")
    Check "Shopping demo order tracking" ($retrieved.order.id -eq $first.id) "Order tracking failed"
    Write-Host "Local Shopping DEMO ORDER ID: $($first.id) — not a real customer order." -ForegroundColor Yellow
    $foodSlug="bazaara-v15-demo-food"
    $null = Api "PATCH" "/v1/food/restaurants/$foodSlug/cart/preferences" @{fulfillmentType="PICKUP";tipMinor=0;cutleryRequired=$false}
    # PAYSTACK_CARD creates a pending order, but no /payment/initialize call is made.
    # No real payment is attempted. The restaurant itself is a demo-only fixture.
    $result = (Api "POST" "/v1/food/restaurants/$foodSlug/orders" @{paymentMethod="PAYSTACK_CARD"} @{ "Idempotency-Key"=("bazaara-v15-"+[guid]::NewGuid().ToString("N")) }).order
    Check "Food DEMO pending order" (-not [string]::IsNullOrEmpty([string]$result.id)) "Demo Food order not created"
    Check "Food DEMO payment remains pending" ($result.paymentStatus -eq "PENDING") "Unexpected Food payment state (check demo order manually)"
    $retrieved = (Api "GET" "/v1/food/orders/$($result.id)").order
    Check "Food DEMO order tracking" ($retrieved.id -eq $result.id) "Food order tracking failed"
    Write-Host "Local Food DEMO ORDER ID: $($result.id). No payment was initialized." -ForegroundColor Yellow
}

try {
    UrlCheck "Shopping web HTTP 200" "$($ShoppingBase.TrimEnd('/'))/shopping"
    UrlCheck "Food web HTTP 200" "$($FoodBase.TrimEnd('/'))/"
    $shopHome = Api "GET" "/v1/shopping/home"
    Check "Shopping catalog API" ($null -ne $shopHome.categories) "Missing home categories"
    $rootCats = @($shopHome.categories | Where-Object { $_.slug -ne 'grocery' })
    Check "Shopping categories returned" ($rootCats.Count -ge 8) "Fewer than eight retail categories. Run V15 demo seed."
    $expected = @(
      @{slug='phones-tablets';name='Phones & Tablets'},
      @{slug='electronics';name='Electronics'},
      @{slug='computing';name='Computing'},
      @{slug='home-kitchen';name='Home & Kitchen'},
      @{slug='fashion';name='Fashion'},
      @{slug='beauty-care';name='Beauty & Care'},
      @{slug='baby-kids';name='Baby & Kids'},
      @{slug='sports-outdoors';name='Sports & Outdoors'}
    )
    $seen=@{}
    $allProducts = @()
    foreach ($cat in ($expected + $rootCats)) {
        if ($seen.ContainsKey([string]$cat.slug)) { continue }
        $seen[[string]$cat.slug] = $true
        $allProducts += @(FindDemoShoppingItem $cat)
    }
    $shopItem = $allProducts | Select-Object -First 1
    $shopDetail = (Api "GET" "/v1/shopping/products/$($shopItem.slug)").product
    Check "Shopping product detail" ($shopDetail.slug -eq $shopItem.slug) "Product detail mismatch"
    $foodHome = Api "GET" "/v1/food/home"
    Check "Food discovery API" ($null -ne $foodHome.restaurants) "No restaurants response"
    $detail = Api "GET" "/v1/food/restaurants/bazaara-v15-demo-food"
    Check "Food demo restaurant" ($detail.restaurant.slug -eq 'bazaara-v15-demo-food') "V15 demo restaurant missing"
    $sections = @($detail.menu)
    Check "Food menu category coverage" ($sections.Count -ge 6) "Expected six demo Food menu sections"
    foreach ($section in $sections) {
        Check "Food section $($section.title)" (@($section.items | Where-Object { $_.available -eq $true -and $_.slug -like 'bazaara-v15-demo-*' }).Count -gt 0) "Missing sample meal"
    }
    $foodItem = @($sections[0].items | Where-Object { $_.slug -like 'bazaara-v15-demo-*' })[0]
    if ($ExerciseCarts) { GuestCartChecks $shopItem $foodItem }
    if ($ExerciseLogin) { LoginChecks $shopItem }
    if ($ExerciseCheckout) { CheckoutChecks $shopItem $foodItem }
    elseif ($ExerciseLogin -and $ExerciseCarts) { CleanupDemoCarts $shopItem $foodItem }
}
catch {
    if ($script:failed -eq 0) { $script:failed=1 }
    Write-Host "SMOKE STOPPED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Fix this step before rerunning. No automatic destructive cleanup occurs." -ForegroundColor Yellow
}
finally {
    $reportFile = Join-Path $reportDir ("bazaara-v15-"+(Get-Date -Format "yyyyMMdd-HHmmss")+".json")
    $results | ConvertTo-Json -Depth 5 | Out-File -LiteralPath $reportFile -Encoding UTF8
    Write-Host "V15 RESULT: $script:passed passed, $script:failed failed. Report: $reportFile" -ForegroundColor $(if ($script:failed -gt 0) { "Red" } else { "Green" })
    if ($script:failed -gt 0) { exit 1 }
}
