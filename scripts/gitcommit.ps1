function ship($branch, $message) {
    git checkout -b $branch
    git add -A
    git commit -m $message
    git push origin $branch
    git checkout master
    git merge $branch
    git branch -D $branch

    $currentBranch = git branch --show-current
    Write-Host "$currentBranch  updated ✅" -ForegroundColor Green
    Write-Host " 🚀 Deployment initiated! " -ForegroundColor Cyan
}