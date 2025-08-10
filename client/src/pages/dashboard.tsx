import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { InvoiceModal } from "@/components/InvoiceModal";
import { ClientModal } from "@/components/ClientModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DollarSign, 
  FileText, 
  Clock, 
  Users, 
  Plus, 
  Bell, 
  BarChart3, 
  ArrowRight, 
  UserPlus,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const { data: analytics, isLoading } = useQuery<{
    totalRevenue: number;
    totalInvoices: number;
    pendingInvoices: number;
    totalClients: number;
    recentInvoices: any[];
    recentClients: any[];
  }>({
    queryKey: ["/api/analytics"],
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400';
      case 'sent': return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue': return 'bg-red-500/20 text-red-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-700 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-slate-700 rounded-2xl"></div>
                ))}
              </div>
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
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Good morning, <span className="gradient-text">{user?.firstName || user?.username}</span> 👋
                </h1>
                <p className="text-slate-300 text-lg">Here's what's happening with your business today</p>
              </div>
              <div className="flex space-x-3 mt-4 md:mt-0">
                <Button 
                  onClick={() => setInvoiceModalOpen(true)}
                  className="gradient-bg rounded-xl px-6 py-3 font-semibold text-white hover:opacity-90 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Invoice</span>
                </Button>
                <Button 
                  onClick={() => setClientModalOpen(true)}
                  variant="ghost"
                  className="glass-dark rounded-xl px-6 py-3 font-semibold text-white hover:bg-white/20 transition-all duration-200 flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Client</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-emerald-400 text-sm font-medium flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5%
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-1">
                {formatCurrency(analytics?.totalRevenue || 0)}
              </h3>
              <p className="text-slate-300">Total Revenue</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-blue-400 text-sm font-medium">+{analytics?.totalInvoices || 0}</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{analytics?.totalInvoices || 0}</h3>
              <p className="text-slate-300">Total Invoices</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-yellow-400 text-sm font-medium">5</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">
                {formatCurrency(analytics?.pendingInvoices || 0)}
              </h3>
              <p className="text-slate-300">Pending Payments</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-purple-400 text-sm font-medium">+3</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{analytics?.totalClients || 0}</h3>
              <p className="text-slate-300">Active Clients</p>
            </GlassCard>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Invoices */}
            <div className="lg:col-span-2">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Recent Invoices</h2>
                  <Button variant="ghost" className="text-purple-400 hover:text-purple-300 font-medium">
                    View all <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {(!analytics?.recentInvoices || analytics.recentInvoices.length === 0) && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No invoices yet. Create your first invoice to get started.</p>
                    </div>
                  )}
                  
                  {(analytics?.recentInvoices || []).map((invoice: any) => (
                    <div key={invoice.id} className="glass-dark rounded-xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold">
                              {getInitials(invoice.client?.name || "Unknown")}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold">{invoice.client?.name || "Unknown Client"}</p>
                            <p className="text-sm text-slate-400">{invoice.invoiceNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(parseFloat(invoice.total))}</p>
                          <Badge className={`text-xs ${getStatusColor(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Quick Actions & Summary */}
            <div className="space-y-6">
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
                <div className="space-y-4">
                  <Button
                    onClick={() => setInvoiceModalOpen(true)}
                    className="w-full glass-dark rounded-xl p-4 flex items-center space-x-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                    variant="ghost"
                  >
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="font-medium">Create Invoice</span>
                  </Button>

                  <Button
                    className="w-full glass-dark rounded-xl p-4 flex items-center space-x-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                    variant="ghost"
                  >
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="font-medium">Send Reminder</span>
                  </Button>

                  <Button
                    className="w-full glass-dark rounded-xl p-4 flex items-center space-x-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                    variant="ghost"
                  >
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-medium">View Reports</span>
                  </Button>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-6">Payment Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">This Month</span>
                    <span className="font-semibold text-emerald-400">
                      {formatCurrency(analytics?.totalRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Outstanding</span>
                    <span className="font-semibold text-yellow-400">
                      {formatCurrency(analytics?.pendingInvoices || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Overdue</span>
                    <span className="font-semibold text-red-400">$0.00</span>
                  </div>
                  <div className="pt-4 border-t border-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium">Net Income</span>
                      <span className="font-bold text-xl gradient-text">
                        {formatCurrency(analytics?.totalRevenue || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Recent Clients */}
          <div className="mt-8">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Clients</h2>
                <Button variant="ghost" className="text-purple-400 hover:text-purple-300 font-medium">
                  Manage clients <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(analytics?.recentClients || []).map((client: any) => (
                  <div key={client.id} className="glass-dark rounded-xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold">{getInitials(client.name)}</span>
                    </div>
                    <h3 className="font-semibold mb-1">{client.name}</h3>
                    <p className="text-sm text-slate-400">{client.email}</p>
                    <p className="text-xs text-emerald-400 mt-2">Active client</p>
                  </div>
                ))}

                <div 
                  onClick={() => setClientModalOpen(true)}
                  className="glass-dark rounded-xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer text-center border-2 border-dashed border-slate-600 flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 glass-dark rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-400">Add New Client</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      <FloatingActionButton onClick={() => setInvoiceModalOpen(true)} />

      <InvoiceModal 
        open={invoiceModalOpen} 
        onOpenChange={setInvoiceModalOpen} 
      />

      <ClientModal 
        open={clientModalOpen} 
        onOpenChange={setClientModalOpen} 
      />
    </div>
  );
}
