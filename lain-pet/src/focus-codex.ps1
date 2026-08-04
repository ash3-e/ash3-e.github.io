param([switch]$Probe, [switch]$FocusOnly)

$signature = @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class LainWindowFocus {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int command);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr SetActiveWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr SetFocus(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint source, uint target, bool attach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern void keybd_event(byte virtualKey, byte scanCode, uint flags, UIntPtr extraInfo);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);
}
'@

Add-Type -TypeDefinition $signature

$officialProcessIds = [System.Collections.Generic.HashSet[uint32]]::new()
$script:lainWindow = [IntPtr]::Zero
$script:lainTitle = ''
$callback = [LainWindowFocus+EnumWindowsProc]{
  param([IntPtr]$window, [IntPtr]$parameter)
  if (-not [LainWindowFocus]::IsWindowVisible($window)) { return $true }
  [uint32]$windowProcessId = 0
  [void][LainWindowFocus]::GetWindowThreadProcessId($window, [ref]$windowProcessId)
  if (-not $officialProcessIds.Contains($windowProcessId)) { return $true }
  $titleLength = [LainWindowFocus]::GetWindowTextLength($window)
  if ($titleLength -le 0) { return $true }
  $title = [System.Text.StringBuilder]::new($titleLength + 1)
  [void][LainWindowFocus]::GetWindowText($window, $title, $title.Capacity)
  if ($title.ToString() -ne 'Codex') { return $true }
  $script:lainWindow = $window
  $script:lainTitle = $title.ToString()
  return $false
}

function Update-CodexProcessIds {
  $officialProcessIds.Clear()
  Get-Process -Name ChatGPT -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      $path = $_.Path
      if (
        $path -like '*\WindowsApps\OpenAI.Codex_*\app\ChatGPT.exe' -or
        $path -like '*\Codex-Lain-Mod\app\ChatGPT.exe'
      ) {
        [void]$officialProcessIds.Add([uint32]$_.Id)
      }
    } catch {}
  }
}

function Find-CodexWindow {
  $script:lainWindow = [IntPtr]::Zero
  $script:lainTitle = ''
  Update-CodexProcessIds
  [void][LainWindowFocus]::EnumWindows($callback, [IntPtr]::Zero)
  return $script:lainWindow -ne [IntPtr]::Zero
}

$found = Find-CodexWindow

if (-not $found -and -not $Probe) {
  # Deliberately do not invoke codex://: doing so can wake the built-in pet.
}

if ($script:lainWindow -eq [IntPtr]::Zero) {
  [pscustomobject]@{ ok = $false; found = $false; message = "CODEX MAIN WINDOW WAS NOT FOUND" } | ConvertTo-Json -Compress
  exit 1
}

if ($Probe) {
  [pscustomobject]@{
    ok = $true
    found = $true
    handle = $script:lainWindow.ToInt64()
    title = $script:lainTitle
  } | ConvertTo-Json -Compress
  exit 0
}

$HWND_TOPMOST = [IntPtr](-1)
$HWND_NOTOPMOST = [IntPtr](-2)
$SW_RESTORE = 9
$SWP_NOMOVE = 0x0002
$SWP_NOSIZE = 0x0001
$SWP_SHOWWINDOW = 0x0040
$flags = $SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW
$VK_MENU = 0x12
$KEYEVENTF_KEYUP = 0x0002

function Set-LainForeground {
  $foregroundWindow = [LainWindowFocus]::GetForegroundWindow()
  [uint32]$foregroundProcessId = 0
  [uint32]$targetProcessId = 0
  $foregroundThread = [LainWindowFocus]::GetWindowThreadProcessId($foregroundWindow, [ref]$foregroundProcessId)
  $targetThread = [LainWindowFocus]::GetWindowThreadProcessId($script:lainWindow, [ref]$targetProcessId)
  $currentThread = [LainWindowFocus]::GetCurrentThreadId()
  $attachedForeground = $false
  $attachedTarget = $false

  try {
    if ($foregroundThread -ne 0 -and $foregroundThread -ne $currentThread) {
      $attachedForeground = [LainWindowFocus]::AttachThreadInput($currentThread, $foregroundThread, $true)
    }
    if ($targetThread -ne 0 -and $targetThread -ne $currentThread) {
      $attachedTarget = [LainWindowFocus]::AttachThreadInput($currentThread, $targetThread, $true)
    }

    [void][LainWindowFocus]::ShowWindowAsync($script:lainWindow, $SW_RESTORE)
    [void][LainWindowFocus]::SetWindowPos($script:lainWindow, $HWND_TOPMOST, 0, 0, 0, 0, $flags)
    [LainWindowFocus]::keybd_event($VK_MENU, 0, 0, [UIntPtr]::Zero)
    [void][LainWindowFocus]::BringWindowToTop($script:lainWindow)
    [void][LainWindowFocus]::SetForegroundWindow($script:lainWindow)
    [void][LainWindowFocus]::SetActiveWindow($script:lainWindow)
    [void][LainWindowFocus]::SetFocus($script:lainWindow)
    [LainWindowFocus]::keybd_event($VK_MENU, 0, $KEYEVENTF_KEYUP, [UIntPtr]::Zero)
  } finally {
    if ($attachedTarget) { [void][LainWindowFocus]::AttachThreadInput($currentThread, $targetThread, $false) }
    if ($attachedForeground) { [void][LainWindowFocus]::AttachThreadInput($currentThread, $foregroundThread, $false) }
  }

  for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
    if ([LainWindowFocus]::GetForegroundWindow() -eq $script:lainWindow) { return $true }
    Start-Sleep -Milliseconds 50
  }
  return $false
}

$focused = Set-LainForeground
[pscustomobject]@{
  ok = $focused
  found = $true
  focused = $focused
  handle = $script:lainWindow.ToInt64()
  message = $(if ($focused) { "CODEX IS READY" } else { "CODEX MAIN WINDOW DID NOT ACCEPT FOCUS" })
} | ConvertTo-Json -Compress

if (-not $focused) {
  [void][LainWindowFocus]::SetWindowPos($script:lainWindow, $HWND_NOTOPMOST, 0, 0, 0, 0, $flags)
  exit 2
}

if ($FocusOnly) {
  [void][LainWindowFocus]::SetWindowPos($script:lainWindow, $HWND_NOTOPMOST, 0, 0, 0, 0, $flags)
  exit 0
}

try {
  while ([LainWindowFocus]::IsWindow($script:lainWindow)) {
    if ([LainWindowFocus]::GetForegroundWindow() -ne $script:lainWindow) { break }
    Start-Sleep -Milliseconds 100
  }
} finally {
  if ([LainWindowFocus]::IsWindow($script:lainWindow)) {
    [void][LainWindowFocus]::SetWindowPos($script:lainWindow, $HWND_NOTOPMOST, 0, 0, 0, 0, $flags)
  }
}
