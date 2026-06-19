'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { GTFLogoIcon } from '@/components/GTFLogo';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const ok = login(password);
    if (ok) {
      toast.success('Welcome back, Admin!');
      router.replace('/dashboard');
    } else {
      toast.error('Invalid password. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top blue bar */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1565C0, #29B6F6, #8BC34A, #2E7D32)' }} />

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo block */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3">
            <GTFLogoIcon size={88} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: '#1565C0' }}>GTF</h1>
            <p className="text-sm font-medium" style={{ color: '#2E7D32' }}>Global Thikkodians Forum</p>
            <p className="text-xs text-muted-foreground mt-0.5">Attendance Management System</p>
          </div>
        </div>

        <Card className="w-full max-w-sm shadow-xl border-0 ring-1 ring-border overflow-hidden">
          {/* Blue-to-green gradient top bar */}
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #1565C0, #29B6F6, #8BC34A, #2E7D32)' }} />
          <CardContent className="pt-6 pb-6 px-6">
            <h2 className="text-base font-semibold text-foreground mb-5">Admin Sign In</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    className="h-11 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © Global Thikkodians Forum
        </p>
      </div>

      {/* Bottom gradient bar */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #2E7D32, #8BC34A, #29B6F6, #1565C0)' }} />
    </div>
  );
}
