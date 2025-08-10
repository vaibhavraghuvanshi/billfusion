import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertInvoiceSchema, InvoiceItem } from "@shared/schema";
import { z } from "zod";
import { X, Plus, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Extended schema for frontend validation
const invoiceFormSchema = insertInvoiceSchema.extend({
  clientId: z.string().min(1, "Client is required"),
  items: z
    .array(
      z.object({
        id: z.string(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        rate: z.number().min(0, "Rate must be positive"),
        amount: z.number(),
      })
    )
    .min(1, "At least one item is required"),
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
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0 },
  ]);
  const [currency, setCurrency] = useState("USD");

  const { data: clientsData } = useQuery<{ clients: any[] }>({
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
    mutationFn: async (data: InvoiceFormData) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
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

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency,
  });

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "", quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "rate") {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = 0; // No tax logic yet
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
    createInvoiceMutation.mutate({
      ...data,
      items,
      currency,
      userId: user?.id || "",
    });
  };

  const handleSaveDraft = () => {
    form.setValue("status", "draft");
    form.handleSubmit(onSubmit)();
  };

  const handleSendInvoice = () => {
    form.setValue("status", "sent");
    form.handleSubmit(onSubmit)();
  };

  const handlePreviewPDF = () => {
    // Placeholder: Replace with real PDF preview logic
    toast({
      title: "Preview PDF",
      description: "This will generate and preview the invoice PDF.",
    });
  };

  const generateInvoiceNumber = () => {
    form.setValue("invoiceNumber", `INV-${Date.now().toString().slice(-6)}`);
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
          <DialogTitle className="text-2xl font-bold gradient-text">
            Create New Invoice
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Client and Invoice Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Client</Label>
              <Select onValueChange={(value) => form.setValue("clientId", value)}>
                <SelectTrigger className="glass-dark border-0">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {(clientsData?.clients || []).map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Invoice Number</Label>
              <Input {...form.register("invoiceNumber")} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Issue Date</Label>
              <Input type="date" {...form.register("issueDate", { valueAsDate: true })} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" {...form.register("dueDate", { valueAsDate: true })} />
            </div>
          </div>

          {/* Items */}
          <div>
            <Label>Invoice Items</Label>
            <div className="glass-dark rounded-xl p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 glass rounded-lg">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Description"
                  />
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    placeholder="Qty"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                    placeholder="Rate"
                  />
                  <div className="w-24 text-right font-semibold">
                    {currencyFormatter.format(item.amount)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={addItem}>
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </div>
          </div>

          {/* Currency and Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={(value) => {
                  setCurrency(value);
                  form.setValue("currency", value);
                }}
              >
                <SelectTrigger className="glass-dark border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="glass-dark rounded-xl p-4 text-right">
                <div className="text-lg font-semibold">
                  Total: <span className="gradient-text">{currencyFormatter.format(Number(form.watch("total")))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Additional notes..." />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <Button type="button" variant="ghost" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button type="button" className="gradient-bg" onClick={handleSendInvoice}>
              {createInvoiceMutation.isPending ? "Creating..." : "Send Invoice"}
            </Button>
            <Button type="button" variant="ghost" onClick={handlePreviewPDF}>
              <FileText className="w-4 h-4" /> Preview PDF
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
