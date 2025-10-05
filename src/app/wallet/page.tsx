'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import UserLayout from '@/components/UserLayout';

const WalletPageContent: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'neft' | 'qr' | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is an image
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please upload an image file');
        setFile(null);
        setPreview('');
        return;
      }
      
      setFile(selectedFile);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    if (!transactionId) {
      setError('Please enter the transaction ID');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!file) {
      setError('Please upload a payment receipt');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // In a real implementation, this would upload the file to a server
      // and process the payment verification
      
      // For now, we'll simulate the process with localStorage
      if (typeof window !== 'undefined' && user) {
        const storedData = localStorage.getItem('stock_analysis_db');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const currentUser = parsedData.users.find((u: { id: string }) => u.id === user.id);
          
          if (currentUser) {
            // Update wallet balance
            const amountValue = parseFloat(amount);
            currentUser.wallet_balance += amountValue;
            
            // Add transaction to history (if it exists)
            if (!currentUser.wallet_transactions) {
              currentUser.wallet_transactions = [];
            }
            
            // Create a new transaction with admin verification fields
            currentUser.wallet_transactions.unshift({
              id: `txn_${Date.now()}`,
              user_id: user.id,
              amount: amountValue,
              transaction_type: 'deposit',
              payment_method: paymentMethod,
              transaction_id: transactionId,
              receipt_path: preview, // In a real app, this would be a path to the stored image
              status: 'pending', // Will be verified by admin
              created_at: new Date().toISOString(),
              admin_verified: false,
              admin_notes: '',
              user: {
                name: user.name,
                email: user.email
              }
            });
            
            // Add to admin payment verification queue
            if (!parsedData.admin_payment_queue) {
              parsedData.admin_payment_queue = [];
            }
            
            // Add to admin queue for verification
            parsedData.admin_payment_queue.push({
              id: `txn_${Date.now()}`,
              user_id: user.id,
              amount: amountValue,
              transaction_type: 'deposit',
              payment_method: paymentMethod,
              transaction_id: transactionId,
              receipt_path: preview,
              status: 'pending',
              created_at: new Date().toISOString(),
              user: {
                name: user.name,
                email: user.email
              }
            });
            
            // Save updated data
            localStorage.setItem('stock_analysis_db', JSON.stringify(parsedData));
            
            // Show success message
            setSuccess(true);
            
            // Redirect to dashboard after a delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('An error occurred while processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Wallet Top-up
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Add funds to your wallet to continue using stock analysis features.
            </p>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700">
            {success ? (
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">Payment Successful!</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Your payment is being processed. Your wallet will be updated once the payment is verified.
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                {/* User ID */}
                <div className="mb-6">
                  <label htmlFor="user-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    User ID
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="user-id"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                      value={user?.id || ''}
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This is your unique user identifier. You&#39;ll need to include this in your payment reference.
                  </p>
                </div>
                
                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'neft' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
                      onClick={() => setPaymentMethod('neft')}
                    >
                      <h5 className="font-medium text-gray-900 dark:text-white">NEFT Transfer</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Transfer funds via NEFT to our account.
                      </p>
                      {paymentMethod === 'neft' && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                          <p className="font-medium">Bank Details:</p>
                          <p>Account Name: StockAnalyzer Ltd</p>
                          <p>Account Number: 1234567890</p>
                          <p>IFSC Code: ABCD0001234</p>
                          <p>Bank: Example Bank</p>
                        </div>
                      )}
                    </div>
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'qr' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
                      onClick={() => setPaymentMethod('qr')}
                    >
                      <h5 className="font-medium text-gray-900 dark:text-white">QR Code Payment</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Scan our QR code to make an instant payment.
                      </p>
                      {paymentMethod === 'qr' && (
                        <div className="mt-3 flex justify-center">
                          {/* This would be a real QR code in a production app */}
                          <div className="w-32 h-32 bg-white p-2 rounded">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                              <path d="M30,30 L30,50 L50,50 L50,30 Z" fill="black" />
                              <path d="M60,30 L60,50 L80,50 L80,30 Z" fill="black" />
                              <path d="M30,60 L30,80 L50,80 L50,60 Z" fill="black" />
                              <path d="M20,20 L20,90 L90,90 L90,20 Z" fill="none" stroke="black" strokeWidth="5" />
                              <path d="M60,60 L70,60 L70,70 L60,70 Z" fill="black" />
                              <path d="M80,60 L80,70 L70,80 L80,80 Z" fill="black" />
                              <path d="M60,80 L60,90" stroke="black" strokeWidth="5" />
                              <path d="M80,80 L90,70" stroke="black" strokeWidth="5" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Amount */}
                <div className="mb-6">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount ($)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                      placeholder="0.00"
                      aria-describedby="price-currency"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step="0.01"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm" id="price-currency">USD</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Minimum amount: $1.00
                  </p>
                </div>
                
                {/* Transaction ID */}
                <div className="mb-6">
                  <label htmlFor="transaction-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transaction ID
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="transaction-id"
                      id="transaction-id"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                      placeholder="Enter the transaction ID from your payment"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Enter the transaction ID or reference number from your payment.
                  </p>
                </div>
                
                {/* Upload Receipt */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload Payment Receipt
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {preview ? (
                        <div className="flex flex-col items-center">
                          <Image src={preview} alt="Preview" className="max-h-64 mb-4" width={400} height={300} />
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setPreview('');
                            }}
                            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove image
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !paymentMethod || !transactionId || !amount || !file}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading || !paymentMethod || !transactionId || !amount || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Submit Payment'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
    </div>
  );
};

// Main page with UserLayout wrapper
const WalletPage: React.FC = () => {
  return (
    <UserLayout>
      <WalletPageContent />
    </UserLayout>
  );
};

export default WalletPage;