import { db } from './firestore';
import { type User, type InsertUser, type Client, type InsertClient, type Invoice, type InsertInvoice, type Payment, type InsertPayment } from "@shared/schema";
import { type IStorage } from './storage';
import { FieldValue } from 'firebase-admin/firestore';

export class FirestoreStorage implements IStorage {
  private usersCollection = db.collection('users');
  private clientsCollection = db.collection('clients');
  private invoicesCollection = db.collection('invoices');
  private paymentsCollection = db.collection('payments');

  // Helper method to generate ID
  private generateId(): string {
    return db.collection('_').doc().id;
  }

  // Helper method to convert Firestore timestamp to Date
  private convertTimestamps(doc: any): any {
    if (!doc) return doc;
    
    const data = { ...doc };
    
    // Convert Firestore timestamps to Date objects
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key].toDate === 'function') {
        data[key] = data[key].toDate();
      }
    });
    
    return data;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
      const doc = await this.usersCollection.doc(id).get();
      if (!doc.exists) return undefined;
      return this.convertTimestamps({ id: doc.id, ...doc.data() }) as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const snapshot = await this.usersCollection.where('email', '==', email).limit(1).get();
      if (snapshot.empty) return undefined;
      const doc = snapshot.docs[0];
      return this.convertTimestamps({ id: doc.id, ...doc.data() }) as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Failed to get user by email');
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = this.generateId();
      const now = FieldValue.serverTimestamp();
      const userData = {
        ...insertUser,
        createdAt: now,
        updatedAt: now,
      };

      await this.usersCollection.doc(id).set(userData);
      
      // Return the created user with current timestamp
      return {
        ...insertUser,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updateData = {
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await this.usersCollection.doc(id).update(updateData);
      
      // Get the updated user
      const updatedUser = await this.getUser(id);
      if (!updatedUser) throw new Error('User not found after update');
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async updateUserRazorpayInfo(id: string, razorpayCustomerId: string, razorpaySubscriptionId: string): Promise<User> {
    return this.updateUser(id, { razorpayCustomerId, razorpaySubscriptionId });
  }

  // Clients
  async getClientsByUserId(userId: string): Promise<Client[]> {
    try {
      const snapshot = await this.clientsCollection.where('userId', '==', userId).get();
      return snapshot.docs.map(doc => 
        this.convertTimestamps({ id: doc.id, ...doc.data() }) as Client
      );
    } catch (error) {
      console.error('Error getting clients by user ID:', error);
      throw new Error('Failed to get clients');
    }
  }

  async getClient(id: string): Promise<Client | undefined> {
    try {
      const doc = await this.clientsCollection.doc(id).get();
      if (!doc.exists) return undefined;
      return this.convertTimestamps({ id: doc.id, ...doc.data() }) as Client;
    } catch (error) {
      console.error('Error getting client:', error);
      throw new Error('Failed to get client');
    }
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    try {
      const id = this.generateId();
      const now = FieldValue.serverTimestamp();
      const clientData = {
        ...insertClient,
        createdAt: now,
        updatedAt: now,
      };

      await this.clientsCollection.doc(id).set(clientData);
      
      return {
        ...insertClient,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Client;
    } catch (error) {
      console.error('Error creating client:', error);
      throw new Error('Failed to create client');
    }
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    try {
      const updateData = {
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await this.clientsCollection.doc(id).update(updateData);
      
      const updatedClient = await this.getClient(id);
      if (!updatedClient) throw new Error('Client not found after update');
      
      return updatedClient;
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error('Failed to update client');
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      await this.clientsCollection.doc(id).delete();
    } catch (error) {
      console.error('Error deleting client:', error);
      throw new Error('Failed to delete client');
    }
  }

  // Invoices
  async getInvoicesByUserId(userId: string): Promise<Invoice[]> {
    try {
      const snapshot = await this.invoicesCollection.where('userId', '==', userId).get();
      return snapshot.docs.map(doc => 
        this.convertTimestamps({ id: doc.id, ...doc.data() }) as Invoice
      );
    } catch (error) {
      console.error('Error getting invoices by user ID:', error);
      throw new Error('Failed to get invoices');
    }
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    try {
      const doc = await this.invoicesCollection.doc(id).get();
      if (!doc.exists) return undefined;
      return this.convertTimestamps({ id: doc.id, ...doc.data() }) as Invoice;
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw new Error('Failed to get invoice');
    }
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    try {
      const id = this.generateId();
      const now = FieldValue.serverTimestamp();
      const invoiceData = {
        ...insertInvoice,
        createdAt: now,
        updatedAt: now,
      };

      await this.invoicesCollection.doc(id).set(invoiceData);
      
      return {
        ...insertInvoice,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const updateData = {
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await this.invoicesCollection.doc(id).update(updateData);
      
      const updatedInvoice = await this.getInvoice(id);
      if (!updatedInvoice) throw new Error('Invoice not found after update');
      
      return updatedInvoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await this.invoicesCollection.doc(id).delete();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw new Error('Failed to delete invoice');
    }
  }

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    try {
      const snapshot = await this.invoicesCollection.where('clientId', '==', clientId).get();
      return snapshot.docs.map(doc => 
        this.convertTimestamps({ id: doc.id, ...doc.data() }) as Invoice
      );
    } catch (error) {
      console.error('Error getting invoices by client ID:', error);
      throw new Error('Failed to get invoices by client ID');
    }
  }

  // Payments
  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    try {
      const snapshot = await this.paymentsCollection.where('invoiceId', '==', invoiceId).get();
      return snapshot.docs.map(doc => 
        this.convertTimestamps({ id: doc.id, ...doc.data() }) as Payment
      );
    } catch (error) {
      console.error('Error getting payments by invoice ID:', error);
      throw new Error('Failed to get payments');
    }
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    try {
      const doc = await this.paymentsCollection.doc(id).get();
      if (!doc.exists) return undefined;
      return this.convertTimestamps({ id: doc.id, ...doc.data() }) as Payment;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw new Error('Failed to get payment');
    }
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    try {
      const id = this.generateId();
      const now = FieldValue.serverTimestamp();
      const paymentData = {
        ...insertPayment,
        createdAt: now,
      };

      await this.paymentsCollection.doc(id).set(paymentData);
      
      return {
        ...insertPayment,
        id,
        createdAt: new Date(),
      } as Payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment');
    }
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    try {
      await this.paymentsCollection.doc(id).update(updates);
      
      const updatedPayment = await this.getPayment(id);
      if (!updatedPayment) throw new Error('Payment not found after update');
      
      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new Error('Failed to update payment');
    }
  }
}