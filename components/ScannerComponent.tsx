import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw } from 'lucide-react';

interface ScannerComponentProps {
  onScan: (code: string) => void;
}

export interface ScannerRef {
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
}

type FacingMode = 'environment' | 'user';

const ScannerComponent = forwardRef<ScannerRef, ScannerComponentProps>(({ onScan }, ref) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<FacingMode>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasScannedRef = useRef(false); // Prevent duplicate scans

  // Expose start/stop methods to parent
  useImperativeHandle(ref, () => ({
    startScanning: () => startScanning(currentFacingMode),
    stopScanning: () => stopScanning(),
  }));

  useEffect(() => {
    const init = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        setHasMultipleCameras(devices && devices.length > 1);
      } catch (err) {
        console.log('Could not enumerate cameras');
      }

      const savedMode = localStorage.getItem('preferredFacingMode') as FacingMode;
      startScanning(savedMode || 'environment');
    };

    init();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async (facingMode: FacingMode) => {
    try {
      setError(null);
      hasScannedRef.current = false; // Reset scan flag

      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }

      html5QrCodeRef.current = new Html5Qrcode("reader", false);

      await html5QrCodeRef.current.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // IMPORTANT: Only process ONCE per scan session
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            
            // Stop scanning immediately after detecting a code
            stopScanning().then(() => {
              onScan(decodedText);
            });
          }
        },
        () => {}
      );

      setIsScanning(true);
      setCurrentFacingMode(facingMode);
      localStorage.setItem('preferredFacingMode', facingMode);
    } catch (err: any) {
      console.error("Error starting scanner", err);
      
      if (facingMode === 'environment') {
        try {
          await startScanning('user');
        } catch (e) {
          setError('Could not access camera. Check permissions.');
        }
      } else {
        setError('Camera access denied.');
      }
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
    }
    setIsScanning(false);
  };

  const handleSwitchCamera = async () => {
    const newMode: FacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await stopScanning();
    await startScanning(newMode);
  };

  const handleRetry = () => {
    startScanning(currentFacingMode);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black aspect-square shadow-2xl">
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center p-4">
          <div className="w-14 h-14 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-3">
            <Camera className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Camera Error</h3>
          <p className="text-gray-400 text-xs text-center mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Paused State - Camera not active */}
      {!isScanning && !error && (
        <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Camera Paused</h3>
          <p className="text-gray-400 text-xs text-center mb-4">Tap below to start scanning</p>
          <button
            onClick={handleRetry}
            className="px-8 py-4 bg-purple-500 text-white rounded-2xl font-bold text-sm flex items-center space-x-2 active:scale-95 transition-transform"
          >
            <Camera className="w-5 h-5" />
            <span>Start Camera</span>
          </button>
        </div>
      )}

      {/* Scanner View */}
      <div id="reader" className="w-full h-full"></div>
      
      {/* Scanner Frame Overlay */}
      {isScanning && (
        <>
          <div className="absolute inset-0 border-2 border-purple-500/40 pointer-events-none rounded-3xl"></div>
          
          <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white pointer-events-none rounded-tl-lg"></div>
          <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white pointer-events-none rounded-tr-lg"></div>
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white pointer-events-none rounded-bl-lg"></div>
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white pointer-events-none rounded-br-lg"></div>
          
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center space-x-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>{currentFacingMode === 'environment' ? 'Rear' : 'Front'}</span>
          </div>

          {hasMultipleCameras && (
            <button
              onClick={handleSwitchCamera}
              className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-black/80 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Switch</span>
            </button>
          )}
        </>
      )}
    </div>
  );
});

ScannerComponent.displayName = 'ScannerComponent';

export default ScannerComponent;