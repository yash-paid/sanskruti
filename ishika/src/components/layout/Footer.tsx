import Link from 'next/link';
import { BRAND, FOOTER_LINKS } from '@/lib/constants';
import { Heart, Camera, Video, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-border/50 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-gradient-rose">ISHIKA&apos;S</span>{' '}
                <span className="text-gradient-gold">WORLD</span>
              </span>
            </Link>
            <p className="text-sm text-muted leading-relaxed mb-6">{BRAND.description}</p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-elevated hover:bg-rose/20 text-muted hover:text-rose transition-all" title="Instagram">
                <Camera className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-elevated hover:bg-rose/20 text-muted hover:text-rose transition-all" title="YouTube">
                <Video className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-elevated hover:bg-rose/20 text-muted hover:text-rose transition-all" title="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
                {section === 'platform' ? 'Platform' : section === 'account' ? 'Account' : 'Support'}
              </h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted hover:text-rose-light transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose fill-rose" /> by Ishika
          </p>
        </div>
      </div>
    </footer>
  );
}
