import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { ClientModal } from "@/components/ClientModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Mail, Phone, Building, MoreVertical, Edit, Trash2, FileText } from "lucide-react";

export default function Clients() {
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clientsData, isLoading } = useQuery<{ clients: any[] }>({
    queryKey: ["/api/clients"],
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredClients = (clientsData?.clients || []).filter((client: any) => {
    return client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setClientModalOpen(true);
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setClientModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-700 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-slate-700 rounded-2xl"></div>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Clients</h1>
              <p className="text-slate-300 text-lg">Manage your client relationships</p>
            </div>
            <Button 
              onClick={handleNewClient}
              className="gradient-bg rounded-xl px-6 py-3 font-semibold text-white hover:opacity-90 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mt-4 md:mt-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </Button>
          </div>

          {/* Search */}
          <GlassCard className="p-6 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-dark border-0 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </GlassCard>

          {/* Clients Grid */}
          {filteredClients.length === 0 ? (
            <GlassCard className="text-center py-16">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No clients found</h3>
              <p className="text-slate-400 mb-6">
                {searchTerm 
                  ? "Try adjusting your search criteria" 
                  : "Add your first client to get started"}
              </p>
              <Button 
                onClick={handleNewClient}
                className="gradient-bg hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client: any) => (
                <GlassCard key={client.id} className="p-6 hover:bg-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {getInitials(client.name)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="glass-dark hover:bg-white/20 p-2"
                      onClick={() => handleEditClient(client)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{client.name}</h3>
                      {client.company && (
                        <p className="text-sm text-slate-400 flex items-center mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          {client.company}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-slate-300 flex items-center">
                        <Mail className="w-3 h-3 mr-2 text-slate-400" />
                        {client.email}
                      </p>
                      {client.phone && (
                        <p className="text-sm text-slate-300 flex items-center">
                          <Phone className="w-3 h-3 mr-2 text-slate-400" />
                          {client.phone}
                        </p>
                      )}
                    </div>

                    {client.notes && (
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {client.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                      <div className="flex items-center space-x-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClient(client)}
                          className="glass-dark hover:bg-white/20 p-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="glass-dark hover:bg-white/20 p-2"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </GlassCard>
              ))}

              {/* Add New Client Card */}
              <div 
                onClick={handleNewClient}
                className="glass border-2 border-dashed border-slate-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all duration-200 cursor-pointer min-h-[280px]"
              >
                <div className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-300 mb-2">Add New Client</h3>
                <p className="text-sm text-slate-400">
                  Start working with a new client by adding their information
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <ClientModal 
        open={clientModalOpen} 
        onOpenChange={setClientModalOpen}
        client={editingClient}
      />
    </div>
  );
}
