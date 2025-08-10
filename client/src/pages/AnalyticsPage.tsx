import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar"; // Adjust the import path if needed

type Analytics = {
  totalRevenue: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalClients: number;
  recentInvoices: any[];
  recentClients: any[];
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Total Revenue</h2>
            <div className="text-3xl font-bold text-blue-400">
              {loading ? "..." : `₹${analytics?.totalRevenue ?? 0}`}
            </div>
          </div>
          <div className="glass p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Total Invoices</h2>
            <div className="text-3xl font-bold text-purple-400">
              {loading ? "..." : analytics?.totalInvoices ?? 0}
            </div>
          </div>
          <div className="glass p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Pending Invoices</h2>
            <div className="text-3xl font-bold text-yellow-400">
              {loading ? "..." : `₹${analytics?.pendingInvoices ?? 0}`}
            </div>
          </div>
          <div className="glass p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Total Clients</h2>
            <div className="text-3xl font-bold text-green-400">
              {loading ? "..." : analytics?.totalClients ?? 0}
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
          <ul className="divide-y divide-border">
            {loading
              ? <li>Loading...</li>
              : analytics?.recentInvoices?.map((inv, i) => (
                  <li key={inv.id || i} className="py-2 flex justify-between">
                    <span>{inv.clientName || "Client"}</span>
                    <span className="font-mono">₹{inv.total}</span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-400 text-white">{inv.status}</span>
                  </li>
                ))}
          </ul>
        </div>
        <div className="glass p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Clients</h2>
          <ul className="divide-y divide-border">
            {loading
              ? <li>Loading...</li>
              : analytics?.recentClients?.map((client, i) => (
                  <li key={client.id || i} className="py-2 flex items-center gap-2">
                    <span className="font-semibold">{client.username || client.email}</span>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </div>
  );
}