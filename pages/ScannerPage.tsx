import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Event, Ticket } from '../types';
import ScannerComponent, { ScannerRef } from '../components/ScannerComponent';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Hash, 
  Loader2,
  Calendar,
  Ticket as TicketIcon,
  Maximize
} from 'lucide-react';

const ScannerPage: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const [successTicket, setSuccessTicket] = useState<Ticket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const scannerRef = useRef<ScannerRef>(null);
  const isProcessingRef = useRef(false); // Ref to prevent race conditions
  const manualEntryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = localStorage.getItem('selectedEvent');
    if (!selected) {
      navigate('/events');
      return;
    }
    setEvent(JSON.parse(selected));
  }, [navigate]);

  const validateCode = (code: string) => {
    const alphanumeric = /^[0-9A-Z]+$/i;
    return code.length === 10 && alphanumeric.test(code);
  };

  const processValidation = async (code: string) => {
    if (!event) return;
    
    // Double-check with ref to prevent race conditions
    if (isProcessingRef.current) {
      console.log('Already processing, skipping...');
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessTicket(null);

    try {
      const response = await apiService.scanTicket(event.id, code);
      
      if (response.success && response.ticket) {
        setSuccessTicket(response.ticket);
        // Camera stays stopped - user must click "Continue Scanning"
      } else {
        setErrorMessage(response.error || response.message || "Ticket validation failed.");
        // Camera stays stopped - user must dismiss error first
      }
    } catch (err) {
      setErrorMessage("Network error validating ticket.");
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  // Called when scanner detects a QR code (camera already stopped by scanner)
  const handleScan = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase();

    if (!validateCode(normalized)) {
      setErrorMessage("Invalid code format. Must be 10 characters.");
      return;
    }

    processValidation(normalized);
  }, [event]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = manualCode.trim().toUpperCase();
    
    if (cleanCode.length !== 10) return;
    if (isProcessingRef.current) return;

    // Stop scanner if running
    await scannerRef.current?.stopScanning();
    
    processValidation(cleanCode);
  };

  // Reset and restart camera
  const handleContinueScanning = async () => {
    setSuccessTicket(null);
    setErrorMessage(null);
    setManualCode('');
    
    // Restart the camera
    await scannerRef.current?.startScanning();
  };

  // Dismiss error and restart camera
  const handleDismissError = async () => {
    setErrorMessage(null);
    await scannerRef.current?.startScanning();
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    // Stop scanner when focusing on manual input
    scannerRef.current?.stopScanning();
    setTimeout(() => {
      manualEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsInputFocused(false);
      // Restart scanner if no modal is showing
      if (!successTicket && !errorMessage && !isProcessing) {
        scannerRef.current?.startScanning();
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col overflow-x-hidden">
      <style>{`
        .scanner-container {
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .scanner-inactive {
          opacity: 0.3;
          transform: scale(0.95);
          filter: grayscale(0.5);
          pointer-events: none;
        }
        .manual-entry-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .manual-entry-active {
          transform: translateY(-20px);
          box-shadow: 0 30px 60px -12px rgba(95, 48, 139, 0.15);
          border-color: rgba(95, 48, 139, 0.2);
        }
      `}</style>

      {/* Header */}
      <header className="bg-gradient-to-r from-[#5F308B] to-[#4A1F6B] px-6 py-6 rounded-b-[40px] shadow-lg sticky top-0 z-10 text-white flex-shrink-0 overflow-hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/events')} className="p-3 bg-white/10 rounded-2xl active:scale-90 transition-all flex-shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-purple-300 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Live Scanning</p>
            <h1 className="text-lg font-black truncate">{event?.name || 'Loading event...'}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 overflow-y-auto overflow-x-hidden">
        {/* Scanner Container */}
        <div className={`scanner-container mb-8 text-center overflow-hidden ${isInputFocused ? 'scanner-inactive' : ''}`}>
          <div className="relative mx-auto w-full max-w-[320px]">
            <ScannerComponent ref={scannerRef} onScan={handleScan} />
            <div className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-xl text-white">
              <Maximize className="w-4 h-4 opacity-80" />
            </div>
          </div>
          <p className="mt-4 text-[#718096] text-[11px] font-black uppercase tracking-wider opacity-60 px-4 break-words">
            Align QR code within frame
          </p>
        </div>

        {/* Divider */}
        <div className={`flex items-center my-10 transition-opacity duration-300 ${isInputFocused ? 'opacity-20' : 'opacity-100'}`}>
          <div className="flex-1 border-t-2 border-dashed border-gray-200"></div>
          <span className="mx-4 text-[#718096] font-black text-[10px] tracking-widest flex-shrink-0">OR</span>
          <div className="flex-1 border-t-2 border-dashed border-gray-200"></div>
        </div>

        {/* Manual Entry Section */}
        <section 
          ref={manualEntryRef}
          className={`manual-entry-card bg-white p-6 sm:p-8 rounded-[40px] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden ${isInputFocused ? 'manual-entry-active' : ''}`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 text-[#5F308B]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-[#2D3748] truncate">Manual Entry</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Type ticket code</p>
              </div>
            </div>
            {isInputFocused && (
              <button 
                onClick={() => {
                  setIsInputFocused(false);
                  document.getElementById('manual-input')?.blur();
                }}
                className="text-xs font-black text-[#5F308B] uppercase tracking-wider flex-shrink-0 ml-2"
              >
                Done
              </button>
            )}
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="relative">
              <input
                id="manual-input"
                type="text"
                autoComplete="off"
                maxLength={10}
                value={manualCode}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="ABC1234567"
                className="w-full text-center tracking-[0.15em] font-mono text-xl sm:text-2xl font-black uppercase px-4 sm:px-6 py-6 bg-[#F7F9FC] border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-[#5F308B]/20 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-[#2D3748] placeholder:text-gray-200"
              />
              <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${manualCode.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-[10px] font-black text-purple-400">{manualCode.length}/10</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || manualCode.trim().length !== 10}
              className="w-full py-5 bg-[#5F308B] text-white font-black rounded-[2rem] shadow-xl shadow-purple-100 active:scale-[0.96] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center group"
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="tracking-wide">Validate Entry</span>
                  <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>
        </section>
      </main>

      {/* SUCCESS MODAL */}
      {successTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#2D3748]/80 backdrop-blur-md overflow-hidden">
          <div className="bg-white w-full max-w-sm rounded-[40px] sm:rounded-[50px] p-8 sm:p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-[30px] sm:rounded-[35px] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-inner">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#10B981]" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-[#2D3748] mb-2">Verified!</h2>
            <p className="text-[#718096] text-sm font-semibold mb-6 sm:mb-8 opacity-80">Access granted to attendee</p>

            <div className="bg-[#F7F9FC] rounded-[30px] sm:rounded-[35px] p-6 sm:p-8 text-left space-y-5 sm:space-y-6 mb-8 sm:mb-10 border border-gray-100 overflow-hidden">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0">
                  <Calendar className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1">Event Name</p>
                  <p className="text-sm font-bold text-[#2D3748] leading-tight break-words">{successTicket.eventName}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0">
                  <TicketIcon className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1">Pass Type</p>
                  <p className="text-sm font-bold text-[#2D3748] break-words">{successTicket.passType}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleContinueScanning}
              className="w-full py-4 sm:py-5 bg-[#10B981] text-white font-black rounded-[2rem] shadow-xl shadow-green-100 active:scale-95 transition-all text-base sm:text-lg"
            >
              Continue Scanning
            </button>
          </div>
        </div>
      )}

      {/* ERROR TOAST */}
      {errorMessage && (
        <div className="fixed bottom-6 sm:bottom-10 left-4 right-4 sm:left-6 sm:right-6 z-40 bg-[#EF4444] text-white p-6 sm:p-8 rounded-[30px] sm:rounded-[35px] shadow-2xl animate-in slide-in-from-bottom-10 border-t-4 border-red-700 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-black text-base sm:text-lg truncate">Invalid Ticket</h3>
            </div>
            <button onClick={handleDismissError} className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 ml-2">
              <XCircle className="w-5 h-5 opacity-40" />
            </button>
          </div>
          <p className="text-red-50 text-sm font-semibold mb-6 sm:mb-8 px-1 break-words">{errorMessage}</p>
          <button 
            onClick={handleDismissError}
            className="w-full py-4 bg-white text-[#EF4444] font-black rounded-2xl active:scale-95 transition-all shadow-lg"
          >
            Dismiss & Retry
          </button>
        </div>
      )}

      {/* PROCESSING OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-[60] bg-white/60 backdrop-blur-[4px] flex items-center justify-center overflow-hidden">
          <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-2xl flex flex-col items-center border border-gray-100">
            <div className="relative">
              <Loader2 className="w-14 h-14 sm:w-16 sm:h-16 text-[#5F308B] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#5F308B]/10 rounded-full animate-ping"></div>
              </div>
            </div>
            <p className="mt-6 text-[#5F308B] font-black uppercase tracking-widest text-xs">Validating...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;