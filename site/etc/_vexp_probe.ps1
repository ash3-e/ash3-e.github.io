$initBody = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"antigravity","version":"1.0"}}}'

$headers = @{
    "Accept" = "application/json, text/event-stream"
}

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:7821/mcp' -Method POST -Body $initBody -ContentType 'application/json' -Headers $headers -UseBasicParsing
    Write-Host "=== INIT Response ==="
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Headers:"
    $response.Headers.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" }
    Write-Host "Body: $($response.Content.Substring(0, [Math]::Min(2000, $response.Content.Length)))"
} catch {
    $err = $_.Exception
    Write-Host "Init error: $($err.Message)"
    if ($err.Response) {
        try {
            $reader = [System.IO.StreamReader]::new($err.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            Write-Host "Status: $($err.Response.StatusCode)"
            Write-Host "Response body: $errBody"
        } catch {
            Write-Host "Could not read error body"
        }
    }
}
