function ship($name, $msg) {
    # 1. Capture the branch name clearly
    $targetBranch = $name

    # 2. Create, Add, Commit, Push
    git checkout -b $targetBranch
    git add -A
    git commit -m $msg
    git push origin $targetBranch

    # 3. Switch to master
    git checkout master

    # 4. THE FIX: Explicitly call the merge using the local variable
    Write-Host "--- CRITICAL: Merging $targetBranch into Master ---" -ForegroundColor Yellow
    git merge $targetBranch --no-ff -m "Merge: $msg"

    # 5. VERIFY: Only delete if the merge actually happened
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success! Cleaning up branch." -ForegroundColor Gray
        git branch -D $targetBranch
    } else {
        Write-Host "❌ MERGE FAILED. Code is still in $targetBranch." -ForegroundColor Red
    }

    $current = $(git branch --show-current)
    Write-Host "`n$current updated locally ✅" -ForegroundColor Green
    Write-Host " 🚀 Deployment initiated! " -ForegroundColor Cyan
}