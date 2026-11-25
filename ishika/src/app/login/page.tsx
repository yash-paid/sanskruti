'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUser } from '@/context/UserContext';
import { BRAND } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [email, setEmail] = useState('ananya@example.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    router.push('/profile');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass rounded-3xl p-8 sm:p-10 border border-rose/30 shadow-2xl shadow-rose/10 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-gradient-rose">ISHIKA&apos;S</span>{' '}
              <span className="text-gradient-gold">WORLD</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-xs text-muted">Sign in to your creator membership account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-rose focus:ring-rose" />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Demo password reset link simulated.')}
              className="text-rose-light hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" variant="primary" className="w-full" size="md">
            <span>Sign In to Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-muted">
          <span>Don&apos;t have an account yet? </span>
          <Link href="/register" className="text-rose-light hover:underline font-semibold">
            Join the Community
          </Link>
        </div>
      </div>
    </div>
  );
}
