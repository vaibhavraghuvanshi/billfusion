import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertClientSchema, insertInvoiceSchema, insertPaymentSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
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
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { invoiceId } = req.body;
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.session.userId) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const amount = Math.round(parseFloat(invoice.total) * 100); // Convert to cents
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: invoice.currency.toLowerCase(),
        metadata: {
          invoiceId: invoice.id,
          userId: req.session.userId,
        },
      });

      await storage.updateInvoice(invoice.id, {
        stripePaymentIntentId: paymentIntent.id,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe webhook
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const event = req.body;

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { invoiceId } = paymentIntent.metadata;

        if (invoiceId) {
          await storage.updateInvoice(invoiceId, {
            status: 'paid',
            paidDate: new Date(),
          });

          await storage.createPayment({
            invoiceId,
            amount: (paymentIntent.amount / 100).toString(),
            currency: paymentIntent.currency.toUpperCase(),
            status: 'completed',
            paymentMethod: 'stripe',
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.charges?.data[0]?.id,
            paidAt: new Date(),
          });
        }
      }

      res.json({ received: true });
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
