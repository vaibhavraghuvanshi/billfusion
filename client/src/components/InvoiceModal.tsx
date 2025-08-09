import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertInvoiceSchema, InvoiceItem } from "@shared/schema";
import { z } from "zod";
import { X, Plus, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const invoiceFormSchema = insertInvoiceSchema.extend({
  clientId: z.string().min(1, "Client is required"),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    rate: z.number().min(0, "Rate must be positive"),
    amount: z.number(),
  })).min(1, "At least one item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: any;
}

export function InvoiceModal({ open, onOpenChange, invoice }: InvoiceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients"],
    enabled: open,
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      userId: user?.id || "",
      clientId: "",
      invoiceNumber: "",
      status: "draft",
      currency: "USD",
      subtotal: "0",
      taxAmount: "0",
      total: "0",
      issueDate: new Date(),
      dueDate: new Date(),
      notes: "",
      items: items,
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: InvoiceFormData) =>
      apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Invoice Created",
        description: "Your invoice has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
      setItems([{ id: "1", description: "", quantity: 1, rate: 0, amount: 0 }]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * 0; // No tax for now
    const total = subtotal + taxAmount;
    
    form.setValue("subtotal", subtotal.toString());
    form.setValue("taxAmount", taxAmount.toString());
    form.setValue("total", total.toString());
    form.setValue("items", items);
  };

  useEffect(() => {
    calculateTotal();
  }, [items]);

  const onSubmit = (data: InvoiceFormData) => {
    const invoiceData = {
      ...data,
      items: items,
      userId: user?.id || "",
    };
    createInvoiceMutation.mutate(invoiceData);
  };

  const generateInvoiceNumber = () => {
    const number = `INV-${Date.now().toString().slice(-6)}`;
    form.setValue("invoiceNumber", number);
  };

  useEffect(() => {
    if (open && !invoice) {
      generateInvoiceNumber();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-glass-border">
        <DialogHeader className="border-b border-slate-600 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold gradient-text">
              Create New Invoice
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="clientId" className="text-sm font-medium text-slate-300">
                Client
              </Label>
              <Select onValueChange={(value) => form.setValue("clientId", value)}>
                <SelectTrigger className="glass-dark border-0 focus:ring-2 focus:ring-purple-500">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent className="glass-dark border-glass-dark-border">
                  {(clientsData?.clients || []).map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoiceNumber" className="text-sm font-medium text-slate-300">
                Invoice Number
              </Label>
              <Input
                {...form.register("invoiceNumber")}
                className="glass-dark border-0 focus:ring-2 focus:ring-purple-500"
                placeholder="INV-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="issueDate" className="text-sm font-medium text-slate-300">
                Issue Date
              </Label>
              <Input
                type="date"
                {...form.register("issueDate", { valueAsDate: true })}
                className="glass-dark border-0 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium text-slate-300">
                Due Date
              </Label>
              <Input
                type="date"
                {...form.register("dueDate", { valueAsDate: true })}
                className="glass-dark border-0 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-300 mb-4 block">
              Invoice Items
            </Label>
            <div className="glass-dark rounded-xl p-4 space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 glass rounded-lg">
                  <div className="flex-1">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Description"
                      className="bg-transparent border-0 focus:ring-0 p-0 text-white placeholder-slate-400"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="bg-transparent border-0 focus:ring-0 p-0 text-center text-white"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                      placeholder="Rate"
                      className="bg-transparent border-0 focus:ring-0 p-0 text-right text-white"
                    />
                  </div>
                  <div className="w-24 text-right font-semibold text-white">
                    ${item.amount.toFixed(2)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-300"
                    disabled={items.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="ghost"
                onClick={addItem}
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="currency" className="text-sm font-medium text-slate-300">
                Currency
              </Label>
              <Select defaultValue="USD" onValueChange={(value) => form.setValue("currency", value)}>
                <SelectTrigger className="glass-dark border-0 focus:ring-2 focus:ring-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dark border-glass-dark-border">
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end">
              <div className="glass-dark rounded-xl p-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    Total: <span className="gradient-text">${form.watch("total")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-slate-300">
              Notes
            </Label>
            <Textarea
              {...form.register("notes")}
              className="glass-dark border-0 focus:ring-2 focus:ring-purple-500 h-24 resize-none"
              placeholder="Additional notes or payment instructions..."
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 glass-dark hover:bg-white/20"
              onClick={() => {
                form.setValue("status", "draft");
                form.handleSubmit(onSubmit)();
              }}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-bg hover:opacity-90"
              disabled={createInvoiceMutation.isPending}
              onClick={() => form.setValue("status", "sent")}
            >
              {createInvoiceMutation.isPending ? "Creating..." : "Send Invoice"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1 glass-dark hover:bg-white/20 flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Preview PDF</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
