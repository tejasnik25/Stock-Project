'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import MathCaptcha from '@/components/ui/MathCaptcha';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [captchaSolved, setCaptchaSolved] = useState(false);

  const sendOtp = async () => {
    if (!email.trim()) return setError('Email is required');
    setError('');
    setLoading(true);
    try {
      // Proceed directly to reset step - no OTP
      setStep('reset');
    } catch (err) {
      setError('Network error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // No OTP verification needed

  const resetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) return setError('Please fill passwords');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setError('');

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error || 'Reset password failed');
      setSuccess('Password changed successfully. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError('Network error resetting password');
    } finally {
      setLoading(false);
    }
  };

  // Helper to set error and auto clear
  const setTip = (v: string) => {
    setError(v);
    if (v) setTimeout(() => setError(''), 4000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 auth-gradient-bg">
      <div className="w-full max-w-md">
        <Card className="w-full auth-card bg-white/10 dark:bg-gray-900/30 backdrop-blur-md">
          <div className="p-4">
            <h2 className="text-2xl font-semibold text-white">Forgot Password</h2>
            <p className="text-sm text-gray-300">Reset your password using OTP sent to your registered email address.</p>
          </div>

          <div className="p-4">
            {error && (
              <div className="p-3 mb-4 text-sm text-pink-300 bg-pink-900/20 rounded-lg border border-pink-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 text-sm text-green-300 bg-green-900/20 rounded-lg border border-green-800 flex items-center">
                {success}
              </div>
            )}

            {step === 'email' && (
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-3"
                />

                <div className="mt-2">
                  <MathCaptcha onSolvedChange={(s) => setCaptchaSolved(s)} />
                </div>

                <div className="mt-4">
                  <Button onClick={sendOtp} disabled={loading || !captchaSolved} className="w-full">{loading ? 'Next' : 'Next'}</Button>
                </div>
              </div>
            )}

              <div className="space-y-4">
                <p className="text-sm text-gray-300">An OTP has been sent to <span className="font-medium">{email}</span>. Enter it below.</p>
                <Input
                  label="OTP"
                  type="text"
                  name="otp"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full py-3"
                />

                <div className="flex gap-3 mt-4">
                  <Button onClick={resetPassword} className="flex-1" disabled={loading}>{loading ? 'Updating...' : 'Reset Password'}</Button>
                </div>
              </div>
            )}

            {step === 'reset' && (
              <div className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full py-3"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full py-3"
                />
                <div className="mt-4">
                  <Button onClick={resetPassword} disabled={loading}>{loading ? 'Updating...' : 'Reset Password'}</Button>
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-300">
              <p>Remembered your password? <Link href="/login" className="text-blue-400 hover:underline">Sign In</Link></p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
