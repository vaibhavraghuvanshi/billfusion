import { z } from "zod";

// Firestore-compatible schema definitions using Zod
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().optional(),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional(),
  razorpayCustomerId: z.string().optional(),
  razorpaySubscriptionId: z.string().optional(),
  subscriptionStatus: z.string().default("free"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const clientSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  clientId: z.string(),
  invoiceNumber: z.string(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  currency: z.string().default("USD"),
  subtotal: z.string(), // Store as string to avoid precision issues
  taxAmount: z.string().default("0"),
  total: z.string(),
  issueDate: z.date(),
  dueDate: z.date(),
  paidDate: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    description: z.string(),
    quantity: z.number(),
    rate: z.number(),
    amount: z.number(),
  })),
  paymentLink: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const paymentSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amount: z.string(), // Store as string to avoid precision issues
  currency: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  paymentMethod: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  paidAt: z.date().optional(),
  createdAt: z.date(),
});

// Insert schemas (omit id and timestamps)
export const insertUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = clientSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = invoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = paymentSchema.omit({
  id: true,
  createdAt: true,
});

// Types
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = z.infer<typeof clientSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Additional types for invoice items
export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};
