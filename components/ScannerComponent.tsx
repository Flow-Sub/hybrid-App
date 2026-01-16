import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Video } from 'lucide-react';

interface ScannerComponentProps {
  onScan: (code: string) => void;
  disabled?: boolean;
}

interface CameraDevice {
  id: string;
  label: string;
}

const ScannerComponent: React.FC<ScannerComponentProps> = ({ onScan, disabled }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [showCameraSelect, setShowCameraSelect] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  useEffect(() => {
    // Initialize and get available cameras
    const initCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const cameraList = devices.map(device => ({
            id: device.id,
            label: device.label || `Camera ${devices.indexOf(device) + 1}`
          }));
          setCameras(cameraList);
          
          // Check if user has a previously selected camera
          const savedCamera = localStorage.getItem('preferredCamera');
          if (savedCamera && cameraList.find(c => c.id === savedCamera)) {
            setSelectedCamera(savedCamera);
            startScanning(savedCamera);
          } else {
            // Show camera selection
            setShowCameraSelect(true);
          }
        }
      } catch (err) {
        console.error("Error getting cameras", err);
        setShowCameraSelect(true);
      }
    };

    initCameras();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async (cameraId: string) => {
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader", false);
      }

      await html5QrCodeRef.current.start(
        cameraId,
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
        (errorMessage) => {
          // Quiet failure during scanning
        }
      );

      setIsScanning(true);
      setShowCameraSelect(false);
      localStorage.setItem('preferredCamera', cameraId);
    } catch (err) {
      console.error("Error starting scanner", err);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
    }
  };

  const handleCameraSelect = (cameraId: string) => {
    setSelectedCamera(cameraId);
    stopScanning().then(() => startScanning(cameraId));
  };

  const handleChangeCameraClick = () => {
    stopScanning();
    setShowCameraSelect(true);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black aspect-square shadow-2xl">
      {/* Camera Selection Modal */}
      {showCameraSelect && cameras.length > 0 && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-white font-black text-xl mb-2">Select Camera</h3>
            <p className="text-gray-400 text-sm font-semibold">Choose which camera to use for scanning</p>
          </div>
          
          <div className="w-full space-y-3">
            {cameras.map((camera) => {
              // Better detection logic - check label for keywords
              const label = camera.label.toLowerCase();
              const isRear = label.includes('back') || 
                           label.includes('rear') || 
                           label.includes('environment') ||
                           label.includes('facing back');
              const isFront = label.includes('front') || 
                            label.includes('user') ||
                            label.includes('facing front') ||
                            label.includes('selfie');
              
              // If label doesn't give clear indication, use position
              // Typically first camera is rear on mobile devices
              const displayName = isRear ? 'Rear Camera' : 
                                isFront ? 'Front Camera' : 
                                camera.label || `Camera ${cameras.indexOf(camera) + 1}`;
              
              const displayDescription = isRear ? 'Recommended for scanning' : 
                                        isFront ? 'Selfie camera' : 
                                        'Available camera';
              
              return (
                <button
                  key={camera.id}
                  onClick={() => handleCameraSelect(camera.id)}
                  className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-purple-500/50 rounded-2xl p-5 transition-all active:scale-95 flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    {isRear || (!isFront && cameras.indexOf(camera) === 0) ? (
                      <Camera className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Video className="w-6 h-6 text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-base">
                      {displayName}
                    </p>
                    <p className="text-gray-400 text-xs font-semibold mt-0.5">
                      {displayDescription}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scanner View */}
      <div id="reader" className="w-full h-full"></div>
      
      {/* Scanner Frame Overlay */}
      {isScanning && (
        <>
          <div className="absolute inset-0 border-2 border-purple-500/40 pointer-events-none rounded-3xl"></div>
          
          {/* Corner Frames - Increased size to match frame */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white pointer-events-none rounded-tl-lg"></div>
          <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white pointer-events-none rounded-tr-lg"></div>
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white pointer-events-none rounded-bl-lg"></div>
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white pointer-events-none rounded-br-lg"></div>
          
          {/* Change Camera Button */}
          {cameras.length > 1 && (
            <button
              onClick={handleChangeCameraClick}
              className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-black/80 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Switch</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ScannerComponent;