import { type User, type Client, type Invoice, type Payment } from './schema';

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Specific API Response Types
export interface AuthResponse {
  user: User;
}

export interface ClientsResponse {
  clients: Client[];
}

export interface InvoicesResponse {
  invoices: Invoice[];
}

export interface InvoiceResponse {
  invoice: Invoice;
}

export interface PaymentsResponse {
  payments: Payment[];
}

export interface AnalyticsResponse {
  totalRevenue: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalClients: number;
  recentInvoices: Invoice[];
  recentClients: Client[];
}

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
}

// Generic success response
export interface SuccessResponse {
  success: boolean;
}