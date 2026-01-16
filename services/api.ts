
import { ApiResponse, User, Event, Ticket } from '../types';

const BASE_URL = 'https://tickets.sidelinesavings.com';

const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const apiService = {
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    // Using the path specified in the integration guide
    const response = await fetch(`${BASE_URL}/api/auth/gatkeeper-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async getEvents(): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/auth/events`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return response.json();
  },

  async scanTicket(eventId: string, confirmationCode: string): Promise<ApiResponse<Ticket>> {
    const response = await fetch(`${BASE_URL}/api/scan-ticket`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ eventId, confirmationCode }),
    });
    return response.json();
  }
};
