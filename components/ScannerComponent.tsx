import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, SwitchCamera } from 'lucide-react';

interface ScannerComponentProps {
  onScan: (code: string) => void;
  disabled?: boolean;
}

type FacingMode = 'environment' | 'user';

const ScannerComponent: React.FC<ScannerComponentProps> = ({ onScan, disabled }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<FacingMode>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if device has multiple cameras
    const checkCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        setHasMultipleCameras(devices && devices.length > 1);
      } catch (err) {
        console.log('Could not enumerate cameras');
      }
    };

    checkCameras();

    // Start with rear camera (environment) by default
    const savedMode = localStorage.getItem('preferredFacingMode') as FacingMode;
    const initialMode = savedMode || 'environment';
    setCurrentFacingMode(initialMode);
    startScanning(initialMode);

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async (facingMode: FacingMode) => {
    try {
      setError(null);
      
      // Stop any existing scanner first
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
      }

      html5QrCodeRef.current = new Html5Qrcode("reader", false);

      // USE facingMode CONSTRAINT - THIS IS THE KEY FIX
      await html5QrCodeRef.current.start(
        { facingMode }, // ← Use facingMode instead of deviceId!
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (!disabled) {
            onScan(decodedText);
          }
        },
        () => {
          // Quiet scanning errors
        }
      );

      setIsScanning(true);
      setCurrentFacingMode(facingMode);
      localStorage.setItem('preferredFacingMode', facingMode);
    } catch (err: any) {
      console.error("Error starting scanner", err);
      
      // If environment camera fails, try user camera
      if (facingMode === 'environment') {
        console.log('Rear camera failed, trying front camera...');
        try {
          await startScanning('user');
        } catch (e) {
          setError('Could not access any camera. Please check permissions.');
        }
      } else {
        setError('Camera access denied or not available.');
      }
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
    }
  };

  const handleSwitchCamera = async () => {
    const newMode: FacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await stopScanning();
    await startScanning(newMode);
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
            onClick={() => startScanning('environment')}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Scanner View */}
      <div id="reader" className="w-full h-full"></div>
      
      {/* Scanner Frame Overlay */}
      {isScanning && (
        <>
          <div className="absolute inset-0 border-2 border-purple-500/40 pointer-events-none rounded-3xl"></div>
          
          {/* Corner Frames */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white pointer-events-none rounded-tl-lg"></div>
          <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white pointer-events-none rounded-tr-lg"></div>
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white pointer-events-none rounded-bl-lg"></div>
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white pointer-events-none rounded-br-lg"></div>
          
          {/* Camera Mode Indicator */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide">
            {currentFacingMode === 'environment' ? '📷 Rear' : '🤳 Front'}
          </div>

          {/* Switch Camera Button - Only show if multiple cameras detected */}
          {hasMultipleCameras && (
            <button
              onClick={handleSwitchCamera}
              className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-black/80 transition-all active:scale-95"
            >
              <SwitchCamera className="w-4 h-4" />
              <span>Switch</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ScannerComponent;