'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUser } from '@/context/UserContext';
import { BRAND } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    router.push('/profile');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass rounded-3xl p-8 sm:p-10 border border-gold/30 shadow-2xl shadow-gold/10 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-gradient-rose">ISHIKA&apos;S</span>{' '}
              <span className="text-gradient-gold">WORLD</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Create Your Account</h1>
          <p className="text-xs text-muted">Join thousands of supporters in Ishika&apos;s exclusive world</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Priya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. priya@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Create Password"
            type="password"
            required
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="text-[11px] text-muted leading-relaxed">
            By creating an account, you agree to Ishika&apos;s World{' '}
            <Link href="/terms" className="text-rose-light underline">Terms of Service</Link>{' '}
            and <Link href="/privacy" className="text-rose-light underline">Privacy Policy</Link>.
          </div>

          <Button type="submit" variant="gold" className="w-full" size="md">
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4 text-background" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-muted">
          <span>Already have an account? </span>
          <Link href="/login" className="text-gold-light hover:underline font-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
