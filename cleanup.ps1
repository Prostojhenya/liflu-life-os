Remove-Item cleanup.sh, cleanup-all.sh, cleanup-all.ps1 -ErrorAction SilentlyContinue
Remove-Item "scripts/migrate-memberIds.ts", "scripts/migrate-memberIds-admin.js" -ErrorAction SilentlyContinue
Remove-Item "public/img/app-icon.png", "public/img/icon.png" -ErrorAction SilentlyContinue

Remove-Item `
  "COMPONENT_SPLITTING_GUIDE.md", `
  "COMPONENT_SPLITTING_SUMMARY.md", `
  "COMPONENTS_REFACTORING_COMPLETE.md", `
  "DASHBOARD_SPLITTING_SUMMARY.md", `
  "PHASE_3_COMPLETE.md", `
  "QUICK_REFACTORING_START.md", `
  "REFACTORING_COMPLETE.md", `
  "REFACTORING_GUIDE.md", `
  "REFACTORING_SUMMARY.md", `
  "REACT_QUERY_GUIDE.md", `
  "ACTIVATION_CHECKLIST.md", `
  "ARCHITECTURE_DIAGRAM.md", `
  "ARCHITECTURE.md", `
  "CLEANUP_DONE.md", `
  "CLEANUP_LIST.md", `
  "SECURITY_REFACTOR_README.md", `
  "CODE_EXAMPLES.md" `
  -ErrorAction SilentlyContinue

git add -A
git commit -m "chore: remove generated files, AI docs, and duplicate assets"
git push

Write-Host "Done!" -ForegroundColor Green
