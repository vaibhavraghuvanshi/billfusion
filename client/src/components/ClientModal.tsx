import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertClientSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const clientFormSchema = insertClientSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
}

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      userId: user?.id || "",
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      address: client?.address || "",
      company: client?.company || "",
      notes: client?.notes || "",
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (data: ClientFormData) =>
      client
        ? apiRequest("PATCH", `/api/clients/${client.id}`, data)
        : apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: client ? "Client Updated" : "Client Created",
        description: `Client has been ${client ? "updated" : "created"} successfully.`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${client ? "update" : "create"} client`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    createClientMutation.mutate({
      ...data,
      userId: user?.id || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass border-glass-border">
        <DialogHeader className="border-b border-slate-600 pb-4">
          <DialogTitle className="text-2xl font-bold gradient-text">
            {client ? "Edit Client" : "Add New Client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-300">
                Client Name *
              </Label>
              <Input
                {...form.register("name")}
                className="glass-dark border-0 focus:ring-2 focus:ring-purple-500"
                placeholder="John Doe"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email Address *
              </Label>
              <Input
                {...form.register("email")}
                type="email"
                className="glass-dark border-0 focus:ring-2 focus:ring-purple-500"
                placeholder="john@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-slate-300">
                Phone Number
              </Label>
              <Input
                {...form.register("phone")}
                className="glass-dark border-0 focus:ring-2 focus:ring-purple-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="company" className="text-sm font-medium text-slate-300">
                Company
              </Label>
              <Input
                {...form.register("company")}
                className="glass-dark border-0 focus:ring-2 focus:ring-purple-500"
                placeholder="Acme Corporation"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium text-slate-300">
              Address
            </Label>
            <Input
              {...form.register("address")}
              className="glass-dark border-0 focus:ring-2 focus:ring-purple-500"
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-slate-300">
              Notes
            </Label>
            <Textarea
              {...form.register("notes")}
              className="glass-dark border-0 focus:ring-2 focus:ring-purple-500 h-24 resize-none"
              placeholder="Additional notes about the client..."
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 glass-dark hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-bg hover:opacity-90"
              disabled={createClientMutation.isPending}
            >
              {createClientMutation.isPending
                ? client
                  ? "Updating..."
                  : "Creating..."
                : client
                ? "Update Client"
                : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
