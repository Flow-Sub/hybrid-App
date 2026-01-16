
export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Event {
  _id: string;
  id: string;
  eventId: number;
  name: string;
  slug: string;
  date: string;
  location: string;
  gateTime: string;
  status: 'active' | 'inactive';
}

export interface Ticket {
  eventName: string;
  passType: string;
  holderName: string;
  section?: string;
  row?: string;
  seat?: string;
  status: string;
  scannedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: User;
  events?: Event[];
  ticket?: Ticket;
}
