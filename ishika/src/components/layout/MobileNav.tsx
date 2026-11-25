'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Video, Crown, ShoppingBag, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

const MOBILE_TABS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Videos', href: '/videos', icon: Video },
  { label: 'VIP', href: '/membership', icon: Crown },
  { label: 'Store', href: '/store', icon: ShoppingBag },
  { label: 'Chat', href: '/community', icon: MessageCircle },
];

export function MobileNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#07070b] border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.95)] pb-safe select-none">
      <div className="flex items-center justify-around h-16">
        {MOBILE_TABS.map(tab => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors relative',
                isActive ? 'text-rose' : 'text-muted'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.label === 'Store' && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-rose text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-rose rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
