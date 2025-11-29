'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  FiHome, 
  FiTrendingUp, 
  FiDollarSign, 
  FiUser, 
  FiLogOut,
  FiCreditCard,
  FiActivity
} from 'react-icons/fi';
import Image from 'next/image';

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
};

const NavItem = ({ href, icon, label, active }: NavItemProps) => {
  return (
    <Link 
      href={href}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center w-12 h-12 text-sm rounded-lg transition-colors fx-3d-card ${active 
        ? 'text-white' 
        : 'text-gray-600 dark:text-gray-300'}`}
    >
      <span className="fx-3d-icon">{icon}</span>
    </Link>
  );
};

interface UserSidebarProps {
  onLogout: () => void;
}

export function UserSidebar({ onLogout }: UserSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`/api/users?id=${encodeURIComponent(session.user.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.user?.wallet_balance === 'number') setWalletBalance(data.user.wallet_balance);
        try {
          const txRes = await fetch('/api/wallet/transactions', { cache: 'no-store' });
          const txData = await txRes.json();
          const txList: any[] = txData?.transactions || [];
          const ownPending = txList.filter(t => t.user_id === session?.user?.id && t.status === 'pending');
          setHasPending(ownPending.length > 0);
        } catch (err) {
          setHasPending(false);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchWallet();
  }, [session?.user?.id]);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <Image src="/logo.svg" alt="Logo" width={32} height={32} />
        <span className="ml-4 text-xl font-bold">
          Copy Trade
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="text-xs text-gray-700 dark:text-gray-300">Wallet: <span className="font-medium text-[#00d09c]">{typeof walletBalance === 'number' ? `$${walletBalance.toFixed(2)}` : '—'}</span></div>
      </div>
      <nav className="mt-4">
        <NavItem 
          href="/dashboard" 
          icon={<FiHome size={18} />} 
          label="Dashboard" 
          active={pathname === '/dashboard'} 
        />
        <NavItem 
          href="/strategies" 
          icon={<FiTrendingUp size={18} />} 
          label="Strategies" 
          active={pathname.startsWith('/strategies')} 
        />
        <NavItem 
          href="/strategies/running" 
          icon={<FiActivity size={18} />} 
          label="Running Strategies" 
          active={pathname === '/strategies/running'} 
        />
        <div className="relative inline-block">
          <NavItem 
            href="/profile/billing" 
            icon={<FiCreditCard size={18} />} 
            label="Billing" 
            active={pathname === '/profile/billing'} 
          />
          {hasPending && (
            <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-yellow-400 shadow-inner" aria-hidden />
          )}
        </div>
        <NavItem 
          href="/dashboard?tab=profile" 
          icon={<FiUser size={18} />} 
          label="Profile" 
          active={pathname === '/dashboard' && typeof window !== 'undefined' && window.location.search.includes('tab=profile')} 
        />
        <div className="relative inline-block">
          <NavItem 
            href="/wallet" 
            icon={<FiDollarSign size={18} />} 
            label="Wallet" 
            active={pathname.startsWith('/wallet')} 
          />
          {hasPending && (
            <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-red-500 shadow-inner" aria-hidden />
          )}
        </div>
        {hasPending && (
          <div className="absolute right-2 mt-[-40px] transform translate-y-1/2 h-2 w-2 rounded-full bg-red-500 shadow-lg" aria-hidden />
        )}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 rounded-lg transition-colors fx-3d-card"
        >
          <span className="mr-3 fx-3d-icon"><FiLogOut size={18} /></span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}