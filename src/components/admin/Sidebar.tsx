'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  FaUsers, 
  FaChartLine, 
  FaCog, 
  FaDatabase, 
  FaSignOutAlt, 
  FaMoneyBillWave,
  FaNetworkWired
} from 'react-icons/fa';

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
      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${active 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Stock Analysis
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Admin Panel</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem 
          href="/admin" 
          icon={<FaUsers size={18} />} 
          label="Users" 
          active={pathname === '/admin'} 
        />
        <NavItem 
          href="/admin/analytics" 
          icon={<FaChartLine size={18} />} 
          label="Analytics" 
          active={pathname === '/admin/analytics'} 
        />
        <NavItem 
          href="/admin/payments" 
          icon={<FaMoneyBillWave size={18} />} 
          label="Payments" 
          active={pathname === '/admin/payments'} 
        />
        <NavItem 
          href="/admin/referrals" 
          icon={<FaNetworkWired size={18} />} 
          label="Referrals" 
          active={pathname === '/admin/referrals'} 
        />
        <NavItem 
          href="/admin/database" 
          icon={<FaDatabase size={18} />} 
          label="Database" 
          active={pathname === '/admin/database'} 
        />
        <NavItem 
          href="/admin/settings" 
          icon={<FaCog size={18} />} 
          label="Settings" 
          active={pathname === '/admin/settings'} 
        />
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <FaSignOutAlt size={18} className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}