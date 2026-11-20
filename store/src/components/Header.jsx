import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, ChevronDown, Menu, X, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Header() {
  const { cartCount, cartTotal, setIsCartOpen, searchQuery, setSearchQuery } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      navigate(`/shop?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      setSearchQuery('');
      navigate('/shop');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#f0f0f0] shadow-sm font-['Lexend_Deca'] text-[#202027]">
      {/* Top Announcement Bar */}
      <div className="bg-[#202027] text-white text-[11px] py-1.5 px-4 text-center font-['Montserrat'] font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="bg-[#ff673c]/20 text-[#ff673c] px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase">Special Offer</span>
        <span>🎉 Flat Mega Sale: Up to 94% OFF on Viral Reels & Infographic Bundles! Instant Download</span>
      </div>

      {/* Main Header Container */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo with SANSKRUTI STORE */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/assets/sanskruti-logo.png"
                alt="Sanskruti Store Logo"
                className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="sr-only">Sanskruti Store</span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              <input
                type="text"
                placeholder="Search viral reels, PowerPoint, worksheets..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-4 pr-24 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-febric-coral focus:ring-2 focus:ring-febric-coral/20 text-sm transition-all bg-gray-50/50"
              />
              <button
                type="submit"
                className="absolute right-1 px-4 py-1.5 bg-febric-dark hover:bg-black text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors"
              >
                <Search size={14} />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Right Action Icons & Cart */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Account Link */}
            <Link
              to="/my-account"
              className="hidden sm:flex items-center gap-1.5 text-gray-700 hover:text-febric-coral text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <div className="p-2 rounded-full bg-gray-50 border border-gray-100 hover:border-gray-300">
                <User size={18} />
              </div>
              <span className="hidden lg:inline">My Account</span>
            </Link>

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-full transition-all group"
              aria-label="View shopping cart"
            >
              <div className="relative">
                <ShoppingBag size={20} className="text-gray-800 group-hover:text-febric-coral transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-febric-coral text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="text-left hidden xs:block">
                <div className="text-[11px] text-gray-400 uppercase font-semibold leading-none">Cart</div>
                <div className="text-xs font-bold text-gray-900 leading-tight">₹{cartTotal}</div>
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-black rounded-lg focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center justify-between border-t border-gray-100 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">
          <div className="flex items-center gap-7">
            <Link
              to="/"
              className={`hover:text-febric-coral transition-colors flex items-center gap-1.5 ${
                isActive('/') ? 'text-febric-coral font-bold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`hover:text-febric-coral transition-colors ${
                isActive('/shop') ? 'text-febric-coral font-bold' : ''
              }`}
            >
              Shop All Products
            </Link>

            {/* Policies Dropdown */}
            <div className="relative group">
              <button
                onMouseEnter={() => setPoliciesOpen(true)}
                onClick={() => setPoliciesOpen(!policiesOpen)}
                className="flex items-center gap-1 hover:text-febric-coral transition-colors uppercase py-1"
              >
                <span>Customer Policies</span>
                <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
              </button>

              <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 hidden group-hover:block transition-all z-50">
                <Link to="/privacy-policy" className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-febric-coral font-medium normal-case">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-febric-coral font-medium normal-case">
                  Terms & Conditions
                </Link>
                <Link to="/refund-policy" className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-febric-coral font-medium normal-case">
                  Refund and Returns Policy
                </Link>
                <Link to="/shipping-policy" className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-febric-coral font-medium normal-case">
                  Shipping Policy
                </Link>
                <Link to="/contact" className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-febric-coral font-medium normal-case border-t border-gray-50">
                  Contact Support
                </Link>
              </div>
            </div>

            <Link
              to="/contact"
              className={`hover:text-febric-coral transition-colors ${
                isActive('/contact') ? 'text-febric-coral font-bold' : ''
              }`}
            >
              Contact Us
            </Link>
          </div>

          <div className="flex items-center gap-4 text-gray-500 font-medium normal-case text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck size={16} /> 100% Instant Delivery
            </span>
            <span className="text-gray-300">|</span>
            <Link to="/admin" className="text-gray-400 hover:text-gray-900 text-[11px]">
              Admin Panel
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-febric-coral"
            />
            <button type="submit" className="absolute right-2.5 top-2.5 text-gray-400">
              <Search size={18} />
            </button>
          </form>

          <div className="space-y-1 font-semibold text-sm">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-800"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-800"
            >
              Shop All Products
            </Link>
            <Link
              to="/my-account"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-800"
            >
              My Account / Past Orders
            </Link>
            <div className="border-t border-gray-100 my-2 pt-2">
              <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Policies & Info</div>
              <Link to="/privacy-policy" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 px-3 text-xs text-gray-600 hover:text-febric-coral">
                Privacy Policy
              </Link>
              <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 px-3 text-xs text-gray-600 hover:text-febric-coral">
                Terms & Conditions
              </Link>
              <Link to="/refund-policy" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 px-3 text-xs text-gray-600 hover:text-febric-coral">
                Refund & Returns Policy
              </Link>
              <Link to="/shipping-policy" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 px-3 text-xs text-gray-600 hover:text-febric-coral">
                Shipping Policy
              </Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 px-3 text-xs text-gray-600 hover:text-febric-coral">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
