function ship($name, $msg) {
    git checkout -b $name
    git add -A
    git commit -m $msg
    git push origin $name

    git checkout master
    git branch -D $name

    Write-Host "Push Successfull 🚀" -ForegroundColor Green
    $merged = $false
    $attempts = 0
    $dotCount = 0

    while (-not $merged) {
        $attempts++
        $dots = "." * ($dotCount % 4)
        $padding = " " * (3 - ($dotCount % 4))

        Write-Host "`rChecking for remote update$dots$padding" -ForegroundColor Yellow -NoNewline

        if ($attempts % 25 -eq 0) {
        git fetch origin master --quiet

        $localRev = git rev-parse master
        $remoteRev = git rev-parse origin/master

        if ($localRev -ne $remoteRev) {
            git pull origin master
            Write-Host "✅ Local master synced " -ForegroundColor Green
            $merged = $true
        } else {
            if ($attempts -gt 500) {
                Write-Host "❌ GitHub Timeout ⌛" -ForegroundColor Red
                break
            }
        }
        Start-Sleep -Milliseconds 100
        $dotCount++
    }
}}