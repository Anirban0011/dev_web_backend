function ship($branch, $message) {
    # 1. Standard Push
    git checkout -b $branch
    git add -A
    git commit -m $message
    git push origin $branch

    # 2. Switch
    git checkout master

    # 3. THE "STAY ALIVE" MERGE
    # We use -f to force PowerShell to treat this as a single execution block
    & {
        Write-Host "--- Attempting Merge of $branch ---" -ForegroundColor Yellow
        git merge "$branch" --no-ff -m "Local merge of $branch"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Merge Successful. Deleting ghost branch..." -ForegroundColor Gray
            git branch -D "$branch"
        } else {
            Write-Host "❌ Merge failed! Keeping branch for safety." -ForegroundColor Red
        }
    }

    # 4. Final Print
    $current = $(git branch --show-current).Trim()
    Write-Host "`n$current updated locally ✅" -ForegroundColor Green
    Write-Host " 🚀 Deployment initiated! " -ForegroundColor Cyan
}