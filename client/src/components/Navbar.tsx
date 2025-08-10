import { Link, useLocation } from "wouter";
import { Bell, Receipt, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useCallback } from "react";

export function Navbar() {
  const [location] = useLocation();
  const { user, firebaseUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stable initials generator
  const getInitials = useCallback((name: string) => {
    if (!name) return "";
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Only recompute nav items once
  const navItems = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/invoices", label: "Invoices" },
      { href: "/clients", label: "Clients" },
      { href: "/analytics", label: "Analytics" },
    ],
    []
  );

  const toggleMenu = useCallback(
    () => setMobileMenuOpen((prev) => !prev),
    []
  );

  const handleNavClick = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setMobileMenuOpen(false);
  }, [logout]);

  // Avatar content — picture or initials
  const avatarElement = useMemo(() => {
    const displayName =
      user?.firstName || firebaseUser?.displayName || user?.username || "";

    if (firebaseUser?.photoURL) {
      return (
        <img
          src={firebaseUser.photoURL}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }

    return (
      <div
        className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center"
        title={displayName}
      >
        <span className="text-sm font-semibold text-white">
          {getInitials(displayName)}
        </span>
      </div>
    );
  }, [firebaseUser?.photoURL, user?.firstName, user?.username, firebaseUser?.displayName, getInitials]);

  return (
    <nav className="fixed top-4 left-4 right-4 z-40">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard">
            <a className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">
                InvoiceFlow
              </span>
            </a>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={`font-medium transition-colors ${
                    location === item.href
                      ? "text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="glass-dark rounded-xl hover:bg-white/20"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>

            {user && avatarElement}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden glass-dark rounded-xl hover:bg-white/20"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-600">
            <div className="space-y-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`block font-medium transition-colors ${
                      location === item.href
                        ? "text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                    onClick={handleNavClick}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-400 hover:text-red-300"
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </nav>
  );
}
