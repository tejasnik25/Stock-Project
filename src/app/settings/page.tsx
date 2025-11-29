"use client";

import React, { useState } from 'react';
import UserLayout from '@/components/UserLayout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/switch';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const handleSave = () => {
    // Mock save
    alert('Settings saved');
  };

  return (
    <UserLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between my-3">
              <p className="text-sm text-gray-400">App Notifications</p>
              <Switch checked={notifications} onCheckedChange={(val) => setNotifications(Boolean(val))} />
            </div>
            <div className="flex items-center justify-between my-3">
              <p className="text-sm text-gray-400">Email Updates</p>
              <Switch checked={emailUpdates} onCheckedChange={(val) => setEmailUpdates(Boolean(val))} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={handleSave}>Save Settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
