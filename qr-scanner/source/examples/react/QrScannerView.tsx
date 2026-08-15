import { useEffect, useRef } from "react";
import { createQrScanner, type QrScannerController, type ScanResult } from "@cyberia-modulus/qr-scan-core";
import "@cyberia-modulus/qr-scan-core/style.css";

export function QrScannerView({
  open,
  onScan,
}: {
  open: boolean;
  onScan: (result: ScanResult) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<QrScannerController | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!hostRef.current) return;
    const scanner = createQrScanner({ onResult: (result) => onScanRef.current(result) });
    scanner.mount(hostRef.current);
    scannerRef.current = scanner;
    return () => {
      scanner.destroy();
      scannerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (open) scannerRef.current?.open();
    else scannerRef.current?.close();
  }, [open]);

  return <div ref={hostRef} className="scanner-route" aria-hidden={!open} />;
}

