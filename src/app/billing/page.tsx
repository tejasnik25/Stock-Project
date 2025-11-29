"use client";

import React, { useState, useEffect } from 'react';
import UserLayout from '@/components/UserLayout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function BillingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.id) return;

        // Fetch wallet balance
        const userRes = await fetch(`/api/users?id=${encodeURIComponent(user.id)}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          if (typeof userData.user?.wallet_balance === 'number') {
            setWalletBalance(userData.user.wallet_balance);
          }
        }

        // Fetch transactions
        const txRes = await fetch('/api/wallet/transactions');
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData.transactions || []);
        }
      } catch (e) {
        console.error('Error loading billing data:', e);
        setTransactions([]);
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [user?.id]);

  return (
    <UserLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Billing</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Available credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{walletBalance !== null ? `$${walletBalance.toFixed(2)}` : '—'}</h3>
                  <p className="text-sm text-gray-400">Available credits in your wallet</p>
                </div>
                <div>
                  <Button onClick={() => router.push('/wallet')} variant="outline">Top up</Button>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="default" onClick={() => router.push('/wallet')}>Top up wallet</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">No saved payment method</p>
              <div className="mt-4">
                <Button variant="outline">Add Payment Method</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">No invoices yet</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{tx.transaction_type}</TableCell>
                        <TableCell>${tx.amount.toFixed(2)}</TableCell>
                        <TableCell><Badge variant={tx.status === 'completed' ? 'success' : 'outline'}>{tx.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
