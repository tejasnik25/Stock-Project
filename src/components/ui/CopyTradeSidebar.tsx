'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiTrendingUp, FiDollarSign, FiUser, FiLogOut, FiGrid, FiSettings, FiShare2, FiPieChart, FiBarChart2, FiCreditCard } from 'react-icons/fi';

interface CopyTradeSidebarProps {
  onLogout: () => void;
}

export const CopyTradeSidebar: React.FC<CopyTradeSidebarProps> = ({ onLogout }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [walletBalance, setWalletBalance] = React.useState<number | null>(null);
  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) return;
        const sess = await res.json();
        const id = sess?.user?.id;
        if (!id) return;
        const userRes = await fetch(`/api/users?id=${encodeURIComponent(id)}`);
        if (!userRes.ok) return;
        const data = await userRes.json();
        if (typeof data.user?.wallet_balance === 'number') setWalletBalance(data.user.wallet_balance);
      } catch (err) {
        // ignore
      }
    };
    fetchBalance();
  }, []);

  const navigationItems = [
    { id: 'dashboard', icon: <FiGrid className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard' },
    { id: 'strategies', icon: <FiTrendingUp className="h-5 w-5" />, label: 'Strategies', path: '/strategies' },
    { id: 'billing', icon: <FiCreditCard className="h-5 w-5" />, label: 'Billing', path: '/billing' },
    { id: 'wallet', icon: <FiDollarSign className="h-5 w-5" />, label: 'Wallet', path: '/wallet' },
    { id: 'profile', icon: <FiUser className="h-5 w-5" />, label: 'Profile', path: '/profile' },
    { id: 'analytics', icon: <FiBarChart2 className="h-5 w-5" />, label: 'Analytics', path: '/analytics' },
    { id: 'settings', icon: <FiSettings className="h-5 w-5" />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 z-40 w-16 flex flex-col bg-[#0e1726] border-r border-[#1b2e4b]">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-[#1b2e4b]">
        <div className="flex h-8 w-8 items-center justify-center">
          <Image src="/financial-growth.svg" alt="Copy Trade" width={24} height={24} />
        </div>
        <div className="text-xs text-gray-400 ml-2">{typeof walletBalance === 'number' ? `$${walletBalance.toFixed(2)}` : ''}</div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col items-center py-4 space-y-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.id}
              href={item.path}
              title={item.label}
              aria-label={item.label}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-md transition-colors fx-3d-card ${
                isActive 
                  ? 'text-[#00d09c]' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-[#00d09c] rounded-r-md" />
              )}
              <div className="flex items-center justify-center fx-3d-icon">
                {item.icon}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="flex flex-col items-center py-4 border-t border-[#1b2e4b]">
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center w-12 h-12 text-gray-400 hover:text-[#00d09c] rounded-md transition-colors fx-3d-card"
        >
          <div className="fx-3d-icon">
            <FiLogOut className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </div>
  );
};