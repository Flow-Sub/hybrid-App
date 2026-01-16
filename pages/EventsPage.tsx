
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Event, User } from '../types';
import { 
  LogOut, 
  RefreshCcw, 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getEvents();
      
      // Robustly handle different response formats
      let eventData: Event[] = [];
      
      if (Array.isArray(response)) {
        eventData = response;
      } else if (response && response.events && Array.isArray(response.events)) {
        eventData = response.events;
      } else if (response && response.success && response.events) {
        eventData = response.events;
      }

      if (eventData.length > 0 || (response && response.events)) {
        setEvents(eventData);
        localStorage.setItem('cachedEvents', JSON.stringify(eventData));
      } else {
        // Check for error messages in response
        if (response.success === false || response.message) {
          setError(response.message || response.error || 'Failed to load events.');
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      const cached = localStorage.getItem('cachedEvents');
      if (cached) {
        setEvents(JSON.parse(cached));
        setError('Showing offline data. Check your connection.');
      } else {
        setError('Unable to fetch events. Network error.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchEvents();
  }, [fetchEvents, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('selectedEvent');
    navigate('/login');
  };

  const handleSelectEvent = (event: Event) => {
    localStorage.setItem('selectedEvent', JSON.stringify(event));
    navigate('/scanner');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBA';
    const d = new Date(dateStr);
    // Handle YYYY-MM-DD correctly without timezone shifts
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <header className="bg-gradient-to-r from-[#5F308B] to-[#4A1F6B] px-6 pt-12 pb-8 rounded-b-[40px] shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-purple-200 text-sm font-medium">Welcome,</p>
            <h1 className="text-2xl font-bold text-white">{user?.name || 'Gatekeeper'}</h1>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={fetchEvents}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-4 pb-12">
        {error && (
          <div className={`mb-4 p-4 rounded-2xl flex items-center text-sm shadow-sm ${error.includes('offline') ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#5F308B] animate-spin mb-4" />
            <p className="text-[#718096]">Loading active events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-[#2D3748]">No Events Found</h3>
            <p className="text-[#718096]">No active events were returned by the server.</p>
          </div>
        ) : (
          <div className="grid gap-4 mt-8">
            {events.map((event) => (
              <button
                key={event._id || event.id}
                onClick={() => handleSelectEvent(event)}
                className="bg-white p-5 rounded-3xl shadow-sm border border-transparent hover:border-[#5F308B]/20 active:scale-[0.98] transition-all text-left flex items-center group"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="px-2 py-1 bg-purple-50 text-[#5F308B] text-[10px] font-bold rounded-lg uppercase tracking-wider border border-purple-100">
                      #{event.eventId}
                    </span>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${event.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <h2 className="text-lg font-bold text-[#2D3748] mb-4 group-hover:text-[#5F308B] transition-colors line-clamp-1">
                    {event.name}
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center text-[#718096] text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center text-[#718096] text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-[#718096] text-sm">
                      <Clock className="w-4 h-4 mr-2 text-purple-400" />
                      Gates: {event.gateTime || 'TBA'}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-[#5F308B] text-xs font-bold uppercase tracking-widest">
                    Tap to scan tickets
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;
