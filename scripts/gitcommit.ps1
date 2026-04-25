function ship($branch, $message) {
    git checkout -b $branch
    git add -A
    git commit -m $message
    git push origin $branch
    git checkout master
    Write-Host "--- Attempting Merge ---" -ForegroundColor Yellow
    git merge $branch --no-ff -m
    git status
    git branch -D $branch

    $current = $(git branch --show-current)
    Write-Host "`n$current updated locally ✅" -ForegroundColor Green
    Write-Host " 🚀 Deployment initiated! " -ForegroundColor Cyan
}