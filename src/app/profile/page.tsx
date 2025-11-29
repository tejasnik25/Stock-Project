"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import UserLayout from '@/components/UserLayout';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/use-toast';

export default function ProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(session?.user?.name || '');
    setEmail(session?.user?.email || '');
  }, [session]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session?.user?.id, name, email }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      toast({ variant: 'default', title: 'Saved', description: 'Profile updated successfully' });
    } catch (err) {
      console.error('Profile update error', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Profile</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Change Password</p>
                </div>
                <div className="md:col-span-2">
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
