'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Crown, Clock, ShoppingBag, Settings, LogOut, CheckCircle2, Bookmark, Bell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useUser } from '@/context/UserContext';

export default function ProfilePage() {
  const { user, isLoggedIn, logout, updateProfile } = useUser();
  const [nameInput, setNameInput] = useState(user?.name || 'Ananya Verma');
  const [emailInput, setEmailInput] = useState(user?.email || 'ananya@example.com');
  const [savedNotification, setSavedNotification] = useState(false);

  if (!isLoggedIn || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full glass border border-border/50 mx-auto flex items-center justify-center">
          <User className="w-8 h-8 text-rose" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sign In to Your Account</h1>
        <p className="text-xs text-muted">Access your membership benefits, watch history, and past merchandise orders.</p>
        <Link href="/login">
          <Button variant="primary" className="w-full">
            Proceed to Login
          </Button>
        </Link>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: nameInput, email: emailInput });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Profile Header Card */}
      <div className="glass rounded-3xl p-6 sm:p-10 border border-border/50 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="text-6xl p-4 rounded-3xl bg-surface border border-rose/30 shadow-lg">
            {user.avatar}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{user.name}</h1>
              {user.membershipTier && (
                <Badge variant="gold">
                  <Crown className="w-3 h-3 mr-1" />
                  {user.membershipTier} Member
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted">{user.email}</p>
            <p className="text-xs text-secondary">Member since {user.joinDate}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-rose/20 text-muted hover:text-rose border border-border/50 transition-colors text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Watch History', href: '/history', count: `${user.watchHistory.length} Episodes`, icon: Clock },
          { label: 'My Membership', href: '/my-membership', count: user.membershipTier || 'Free Explorer', icon: Crown },
          { label: 'Past Orders', href: '/orders', count: '3 Orders', icon: ShoppingBag },
          { label: 'Saved Videos', href: '/history', count: `${user.savedVideos.length} Saved`, icon: Bookmark },
        ].map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <Link
              key={idx}
              href={tile.href}
              className="p-5 rounded-2xl glass border border-border/50 hover:border-rose/40 transition-all space-y-2 group"
            >
              <Icon className="w-5 h-5 text-rose group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-rose-light transition-colors">{tile.label}</p>
                <p className="text-[11px] text-muted">{tile.count}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Profile Edit Form */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-border/50 space-y-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Settings className="w-4 h-4 text-gold" />
          <span>Personal Account Details</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <Input
            label="Full Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="md">
            Save Profile Changes
          </Button>

          {savedNotification && (
            <p className="text-xs text-emerald-400">✓ Your profile has been updated!</p>
          )}
        </form>
      </div>
    </div>
  );
}
