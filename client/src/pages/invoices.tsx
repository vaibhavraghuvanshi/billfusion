import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { InvoiceModal } from "@/components/InvoiceModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";

export default function Invoices() {
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'sent': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'draft': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredInvoices = (invoicesData?.invoices || []).filter((invoice: any) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-700 rounded w-1/3"></div>
              <div className="h-64 bg-slate-700 rounded-2xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Invoices</h1>
              <p className="text-slate-300 text-lg">Manage all your invoices in one place</p>
            </div>
            <Button 
              onClick={() => setInvoiceModalOpen(true)}
              className="gradient-bg rounded-xl px-6 py-3 font-semibold text-white hover:opacity-90 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mt-4 md:mt-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </Button>
          </div>

          {/* Filters */}
          <GlassCard className="p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-dark border-0 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 glass-dark border-0 focus:ring-2 focus:ring-purple-500">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="glass-dark border-glass-dark-border">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {/* Invoices List */}
          <GlassCard className="overflow-hidden">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No invoices found</h3>
                <p className="text-slate-400 mb-6">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "Create your first invoice to get started"}
                </p>
                <Button 
                  onClick={() => setInvoiceModalOpen(true)}
                  className="gradient-bg hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-600">
                    <tr className="text-left">
                      <th className="p-4 font-semibold text-slate-300">Invoice</th>
                      <th className="p-4 font-semibold text-slate-300">Client</th>
                      <th className="p-4 font-semibold text-slate-300">Amount</th>
                      <th className="p-4 font-semibold text-slate-300">Status</th>
                      <th className="p-4 font-semibold text-slate-300">Issue Date</th>
                      <th className="p-4 font-semibold text-slate-300">Due Date</th>
                      <th className="p-4 font-semibold text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice: any) => (
                      <tr key={invoice.id} className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{invoice.invoiceNumber}</p>
                              <p className="text-sm text-slate-400">#{invoice.id.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-white">{invoice.client?.name || "Unknown"}</p>
                          <p className="text-sm text-slate-400">{invoice.client?.email || ""}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{formatCurrency(invoice.total)}</p>
                          <p className="text-sm text-slate-400">{invoice.currency}</p>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getStatusColor(invoice.status)} border`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-300">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="p-4 text-slate-300">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" className="glass-dark hover:bg-white/20 p-2">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="glass-dark hover:bg-white/20 p-2">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="glass-dark hover:bg-white/20 p-2">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </main>

      <InvoiceModal 
        open={invoiceModalOpen} 
        onOpenChange={setInvoiceModalOpen} 
      />
    </div>
  );
}
