'use client';
// ============================================================
// ISHIKA'S WORLD — User Context (Demo with LocalStorage)
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserProfile } from '@/types';

interface UserContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setMembershipTier: (tier: string) => void;
}

const DEMO_USER: UserProfile = {
  id: 'demo-user-1',
  name: 'Ananya Verma',
  email: 'ananya@example.com',
  avatar: '🌸',
  joinDate: '2026-06-15',
  membershipTier: 'Free',
  watchHistory: ['v1', 'v2', 'v4', 'v5', 'v7', 'v9', 'v10'],
  savedVideos: ['v3', 'v6', 'v10'],
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEMO_USER);

  // Load persisted user or membership from localStorage on client mount
  useEffect(() => {
    try {
      const isPurchased = localStorage.getItem('ishika_membership_purchased') === 'true';
      if (isPurchased) {
        const savedTier = localStorage.getItem('ishika_user_tier') || 'Free';
        if (savedTier === 'VIP' || savedTier === 'Elite' || savedTier === 'Explorer') {
          const savedProfile = localStorage.getItem('ishika_user_profile');
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            setUser({ ...parsed, membershipTier: savedTier });
          } else {
            setUser(prev => (prev ? { ...prev, membershipTier: savedTier } : { ...DEMO_USER, membershipTier: savedTier }));
          }
        } else {
          localStorage.removeItem('ishika_membership_purchased');
          setUser(prev => (prev ? { ...prev, membershipTier: 'Free' } : { ...DEMO_USER, membershipTier: 'Free' }));
        }
      } else {
        // Strictly Free by default until membership is explicitly purchased!
        localStorage.removeItem('ishika_membership_purchased');
        setUser(prev => (prev ? { ...prev, membershipTier: 'Free' } : { ...DEMO_USER, membershipTier: 'Free' }));
      }
    } catch { }
  }, []);

  const isLoggedIn = user !== null;

  const login = useCallback((_email: string, _password: string) => {
    setUser(DEMO_USER);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem('ishika_user_profile');
      localStorage.removeItem('ishika_user_tier');
    } catch { }
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...updates } : { ...DEMO_USER, ...updates };
      try {
        localStorage.setItem('ishika_user_profile', JSON.stringify(updated));
        if (updates.membershipTier) {
          localStorage.setItem('ishika_user_tier', updates.membershipTier);
        }
      } catch { }
      return updated;
    });
  }, []);

  const setMembershipTier = useCallback((tier: string) => {
    setUser(prev => {
      const updated = prev
        ? { ...prev, membershipTier: tier }
        : { ...DEMO_USER, membershipTier: tier };
      try {
        localStorage.setItem('ishika_user_profile', JSON.stringify(updated));
        localStorage.setItem('ishika_user_tier', tier);
        localStorage.setItem('ishika_membership_purchased', 'true');
      } catch { }
      return updated;
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoggedIn, login, logout, updateProfile, setMembershipTier }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
