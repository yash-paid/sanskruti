import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2 } from 'lucide-react';

export default function Toast() {
  const { toastMessage } = useStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
      <div className="bg-febric-dark text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-gray-700">
        <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
