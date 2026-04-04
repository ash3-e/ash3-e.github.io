# C:\Users\ashe\downloads\site\claude-auto-continue.ps1

Set-Location "C:\Users\ashe\downloads\site"

$session = "84281f68-6a62-41e2-a469-0b9aaad577cc"
$logDir = "C:\Users\ashe\downloads\site\claude-logs"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$prompt = @"
Continue from where we left off. Do not restart from scratch.
First briefly restate the current goal, then continue the task.
"@

claude --resume $session --dangerously-skip-permissions $prompt 2>&1 |
  Tee-Object -FilePath "$logDir\claude-auto-$timestamp.log"