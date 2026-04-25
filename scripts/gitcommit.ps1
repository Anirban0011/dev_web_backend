function ship($name, $msg) {
    # 1. Create and Commit
    git checkout -b $name
    git add -A
    git commit -m $msg
    git push origin $name

    # 2. THE SECRET MOVE: Merge master INTO your feature branch first
    # This ensures the feature branch has the full history
    git merge master --no-edit

    # 3. Go to master and pull the branch in
    git checkout master

    # Use the branch name directly in the command
    Invoke-Expression "git merge $name"

    # 4. Cleanup
    git branch -D $name

    Write-Host "✅ Process Complete" -ForegroundColor Green
}