/**
 * TestingBanner — Banner flotante para indicar que estamos en modo testing
 */

import React from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '../ui/button';

interface TestingBannerProps {
  onDismiss?: () => void;
}

export function TestingBanner({ onDismiss }: TestingBannerProps) {
  const [visible, setVisible] = React.useState(() => {
    return localStorage.getItem('cerebrin_testing_banner_dismissed') !== 'true';
  });

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('cerebrin_testing_banner_dismissed', 'true');
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-2xl w-full px-4">
      <div className="bg-violet-600 text-white rounded-lg shadow-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold mb-1">🧪 Modo Testing: Onboarding V3.0</p>
          <p className="text-violet-100 text-xs">
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Cmd/Ctrl + O</kbd> → Onboarding •{' '}
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Cmd/Ctrl + D</kbd> → Dashboard •{' '}
            Panel debug para resetear.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
