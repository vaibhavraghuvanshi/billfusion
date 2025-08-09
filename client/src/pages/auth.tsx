import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/GlassCard";
import { Receipt } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleEmailAuth = async (data: AuthFormData) => {
    setLoading(true);
    try {
      if (authMode === "signin") {
        await signInWithEmail(data.email, data.password);
      } else {
        await signUpWithEmail(data.email, data.password);
      }
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGitHub();
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-bg rounded-2xl mb-4 animate-glow">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Welcome to InvoiceFlow</h1>
          <p className="text-slate-300">
            {authMode === "signin" 
              ? "Sign in to manage your invoices and payments" 
              : "Create your account to get started"}
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full glass-dark rounded-xl p-4 flex items-center justify-center space-x-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            variant="ghost"
          >
            <FaGoogle className="text-xl" />
            <span className="font-medium">Continue with Google</span>
          </Button>

          <Button
            onClick={handleGitHubSignIn}
            className="w-full glass-dark rounded-xl p-4 flex items-center justify-center space-x-3 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            variant="ghost"
          >
            <FaGithub className="text-xl" />
            <span className="font-medium">Continue with GitHub</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-slate-400">or</span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(handleEmailAuth)} className="space-y-4">
            <div>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="Email address"
                className="glass-dark rounded-xl border-0 focus:ring-2 focus:ring-purple-500 focus:bg-white/10"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Input
                {...form.register("password")}
                type="password"
                placeholder="Password"
                className="glass-dark rounded-xl border-0 focus:ring-2 focus:ring-purple-500 focus:bg-white/10"
              />
              {form.formState.errors.password && (
                <p className="text-red-400 text-sm mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg rounded-xl py-3 font-semibold text-white hover:opacity-90 transition-all duration-200 transform hover:scale-105 animate-glow"
            >
              {loading 
                ? "Please wait..." 
                : authMode === "signin" 
                  ? "Sign In" 
                  : "Sign Up"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              {authMode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
