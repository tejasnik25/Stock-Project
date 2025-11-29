"use client";

import React from 'react';
import UserLayout from '@/components/UserLayout';
import BillingPage from '@/app/billing/page';

// Reuse the main billing page under the profile/billing route
export default function ProfileBillingPage() {
  return (
    <UserLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Billing</h1>
        {/* Render billing layout */}
        <BillingPage />
      </div>
    </UserLayout>
  );
}
