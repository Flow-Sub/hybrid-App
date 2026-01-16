
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger entry animations
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.login(email, password);
      if (response.success && response.token && response.user) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        navigate('/events');
      } else {
        setError(response.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('A network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-white flex flex-col items-center justify-center p-6 select-none">
      {/* 
        Premium Diagonal Split Background 
        Half purple, half white with a sharp diagonal cut 
      */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: 'linear-gradient(155deg, #5F308B 0%, #4A1F6B 50%, #ffffff 50%, #ffffff 100%)',
            backgroundSize: '100% 100%',
          }}
        />
        {/* Subtle moving light effect in the purple section */}
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            animation: 'pulseGlow 8s ease-in-out infinite'
          }}
        />
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.4; }
        }
        .reveal-card {
          transform: translateY(80px);
          opacity: 0;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease-out;
        }
        .reveal-card.active {
          transform: translateY(0);
          opacity: 1;
        }
        .logo-reveal {
          transform: scale(0.9);
          opacity: 0;
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out;
          transition-delay: 0.1s;
        }
        .logo-reveal.active {
          transform: scale(1);
          opacity: 1;
        }
        /* Anti-scroll fix for mobile height issues */
        @media (max-height: 700px) {
          .login-card {
            padding: 1.5rem !important;
          }
          .form-spacing {
            margin-bottom: 0.75rem !important;
          }
          .logo-section {
            margin-bottom: 1.5rem !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Logo Section */}
        <div className={`logo-section flex flex-col items-center mb-8 logo-reveal ${isLoaded ? 'active' : ''}`}>
          <div className="mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)]">
            <img 
              src="https://sidelinesavings.com/wp-content/uploads/2025/05/Sidelines-Savings-Logo-2.png" 
              alt="Sideline Savings" 
              className="h-20 w-auto object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
              style={{ maxHeight: '80px' }}
            />
          </div>
          <div className="flex items-center space-x-2 text-white/70">
            <ShieldCheck className="w-4 h-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Gatekeeper Access</p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className={`login-card w-full bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] p-10 border border-gray-50 flex flex-col reveal-card ${isLoaded ? 'active' : ''}`}>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#2D3748] tracking-tight leading-none mb-2">Welcome</h1>
            <p className="text-[#718096] text-sm font-semibold opacity-80">Authenticate to start scanning.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-600 text-xs animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 form-spacing">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-[#F7F9FC] border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-200 outline-none transition-all font-bold text-[#2D3748] placeholder:text-gray-300"
                placeholder="email@sideline.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-[#F7F9FC] border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-200 outline-none transition-all font-bold text-[#2D3748] placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 mt-4 bg-[#5F308B] hover:bg-[#4A1F6B] text-white font-black rounded-2xl shadow-xl shadow-purple-200 active:scale-[0.97] disabled:opacity-70 disabled:active:scale-100 transition-all flex items-center justify-center group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="tracking-wide">Sign In</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col items-center">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.25em]">Authorized Staff Only</p>
          </div>
        </div>

        {/* Footer Credit */}
        <p className={`mt-10 text-center text-[#718096]/40 text-[9px] font-black uppercase tracking-[0.4em] transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          Sideline Savings &copy; 2025
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
