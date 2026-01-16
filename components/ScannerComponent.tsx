
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface ScannerComponentProps {
  onScan: (code: string) => void;
  disabled?: boolean;
}

const ScannerComponent: React.FC<ScannerComponentProps> = ({ onScan, disabled }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true
        },
        false
      );
    }

    const onScanSuccess = (decodedText: string) => {
      if (disabled) return;
      onScan(decodedText);
    };

    const onScanFailure = (error: any) => {
      // Quiet failure, normal for QR library during seeking
    };

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan, disabled]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-black aspect-square">
      <div id="reader" className="w-full"></div>
      <div className="absolute inset-0 border-2 border-[#5F308B]/30 pointer-events-none rounded-3xl"></div>
      {/* Decorative frame */}
      <div className="absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 border-white pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 border-white pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 border-white pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 border-white pointer-events-none"></div>
    </div>
  );
};

export default ScannerComponent;
