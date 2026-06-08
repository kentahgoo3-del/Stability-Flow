import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
const logoSrc = "/stabilityflow-logo.png";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("sf_user", JSON.stringify(data.user));
      onLogin(data.user);
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <img
            src={logoSrc}
            alt="StabilityFlow"
            className="w-64 h-auto object-contain drop-shadow-md"
            data-testid="img-login-logo"
          />
          <p className="text-sm text-muted-foreground tracking-wide">
            Pharmaceutical Stability Management
          </p>
        </div>

        <Card className="w-full shadow-lg border-border/60">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  data-testid="input-username"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  data-testid="input-password"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-1"
                disabled={loading || !username || !password}
                data-testid="button-login"
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground/60 text-center">
          GMP-compliant · 21 CFR Part 11 ready · ICH Q1A(R2)
        </p>
      </div>
    </div>
  );
}
