import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import Razorpay from "razorpay";
import { storage } from "./storage";
import { insertClientSchema, insertInvoiceSchema, insertPaymentSchema } from "@shared/schema";

// Extend Express Request to include session
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth middleware
  const requireAuth = (req: Request & { session: any }, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // User routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, firebaseUid, userData } = req.body;
      
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          email,
          username: userData.displayName || userData.email?.split('@')[0] || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          avatarUrl: userData.photoURL || '',
        });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/user", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.session.userId, updates);
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Client routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClientsByUserId(req.session.userId);
      res.json({ clients });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const client = await storage.createClient(clientData);
      res.json({ client });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const client = await storage.updateClient(id, updates);
      res.json({ client });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Invoice routes
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByUserId(req.session.userId);
      res.json({ invoices });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      if (!invoice || invoice.userId !== req.session.userId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json({ invoice });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const invoice = await storage.createInvoice(invoiceData);
      res.json({ invoice });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const invoice = await storage.updateInvoice(id, updates);
      res.json({ invoice });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvoice(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment routes
  app.post("/api/create-payment-order", requireAuth, async (req, res) => {
    try {
      const { invoiceId } = req.body;
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.session.userId) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const amount = Math.round(parseFloat(invoice.total) * 100); // Convert to paise
      
      const order = await razorpay.orders.create({
        amount,
        currency: invoice.currency,
        receipt: `invoice_${invoice.id}`,
        notes: {
          invoiceId: invoice.id,
          userId: req.session.userId,
        },
      });

      await storage.updateInvoice(invoice.id, {
        razorpayOrderId: order.id,
      });

      res.json({ 
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Razorpay webhook
  app.post("/api/webhooks/razorpay", async (req, res) => {
    try {
      const event = req.body;

      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const { invoiceId } = payment.notes;

        if (invoiceId) {
          await storage.updateInvoice(invoiceId, {
            status: 'paid',
            paidDate: new Date(),
          });

          await storage.createPayment({
            invoiceId,
            amount: (payment.amount / 100).toString(),
            currency: payment.currency.toUpperCase(),
            status: 'completed',
            paymentMethod: 'razorpay',
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id,
            paidAt: new Date(),
          });
        }
      }

      res.json({ status: 'ok' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verify payment
  app.post("/api/verify-payment", requireAuth, async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature, invoiceId } = req.body;
      
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== req.session.userId) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                      .update(body.toString())
                                      .digest('hex');

      if (expectedSignature === razorpay_signature) {
        // Payment is verified
        await storage.updateInvoice(invoiceId, {
          status: 'paid',
          paidDate: new Date(),
        });

        await storage.createPayment({
          invoiceId,
          amount: invoice.total,
          currency: invoice.currency,
          status: 'completed',
          paymentMethod: 'razorpay',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          paidAt: new Date(),
        });

        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        res.status(400).json({ success: false, message: "Invalid payment signature" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard analytics
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByUserId(req.session.userId);
      const clients = await storage.getClientsByUserId(req.session.userId);

      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      const pendingAmount = invoices
        .filter(inv => inv.status === 'sent')
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      const overdueAmount = invoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      const analytics = {
        totalRevenue,
        totalInvoices: invoices.length,
        pendingInvoices: pendingAmount,
        totalClients: clients.length,
        recentInvoices: invoices.slice(-5),
        recentClients: clients.slice(-4),
      };

      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
