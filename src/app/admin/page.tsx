'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FiUsers, FiDollarSign, FiLink, FiDatabase, FiActivity, FiTrendingUp } from 'react-icons/fi';
import UserManagement from '@/components/admin/UserManagement';
import StrategyManagement from '@/components/admin/StrategyManagement';
import PaymentVerification from '@/components/admin/PaymentVerification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    
    // Check if this is an active admin session
    const isAdminSessionActive = typeof window !== 'undefined' && 
                               localStorage.getItem('adminSessionActive') === 'true';
    
    if (status === 'unauthenticated') {
      // Clear admin session indicator if not authenticated
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminSessionActive');
      }
      router.push('/admin-login'); // Redirect to admin login if not authenticated
    } else if (status === 'authenticated') {
      // If this is explicitly an admin session but user doesn't have admin role
      if (isAdminSessionActive && session?.user?.role !== 'ADMIN') {
        // Display a warning before redirecting
        alert('Admin session has expired or been replaced. Redirecting to user dashboard.');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminSessionActive');
        }
        router.push('/dashboard');
      }
      // If this is a regular user session that navigated to admin page
      else if (!isAdminSessionActive && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  // Show a loading state while session is being checked
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render admin content if user is authenticated and has admin role
  if (status !== 'authenticated' || !session || session.user.role !== 'ADMIN') {
    return null; // Let the layout handle the redirection
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard ({session.user.name})</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <FiUsers className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <FiActivity className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <FiDollarSign className="h-4 w-4" /> Payments
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <FiLink className="h-4 w-4" /> Referrals
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <FiDatabase className="h-4 w-4" /> Database
          </TabsTrigger>
          <TabsTrigger value="strategies" className="flex items-center gap-2">
            <FiTrendingUp className="h-4 w-4" /> Strategies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View system analytics and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Analytics dashboard will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>Verify and manage payment requests and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentVerification />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral Program</CardTitle>
              <CardDescription>Manage user referrals and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Referral management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Manage database operations and backups</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Database management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="strategies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Management</CardTitle>
              <CardDescription>Add, edit, and delete trading strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <StrategyManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}