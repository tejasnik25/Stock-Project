'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, RefreshCw, Eye, Mail, Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'deposit' | 'charge';
  payment_method?: string;
  transaction_id?: string;
  receipt_path?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
  admin_id?: string;
  user?: {
    name: string;
    email: string;
  };
}

interface PaymentVerificationProps {
  onSendEmail?: () => void;
}

export default function PaymentVerification({ onSendEmail }: PaymentVerificationProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const fetchPendingTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      console.error('Error fetching pending transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async () => {
    if (!selectedTransaction || !actionType) return;

    setProcessingAction(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/transactions/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: actionType }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} transaction`);
      }

      // Close dialog and refresh list
      setActionDialogOpen(false);
      toast({ 
        variant: 'default', 
        title: 'Success', 
        description: `Transaction ${actionType}d successfully` 
      });
      fetchPendingTransactions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      console.error(`Error ${actionType}ing transaction:`, err);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSendLowBalanceEmail = async (userId: string, userEmail: string) => {
    try {
      // In a real implementation, this would call an API to send emails
      console.log(`Simulating sending low balance email to ${userEmail}`);
      
      // For now, just show a success message
      toast({ 
        variant: 'default', 
        title: 'Success', 
        description: 'Email reminder sent successfully' 
      });
      
      // Call the parent callback if provided
      if (onSendEmail) {
        onSendEmail();
      }
    } catch (err) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to send email reminder' 
      });
      console.error('Error sending email:', err);
    }
  };

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptDialogOpen(true);
  };

  const handleActionDialogOpen = (transaction: Transaction, action: 'approve' | 'reject') => {
    setSelectedTransaction(transaction);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!session || session.user?.role !== 'ADMIN') {
    router.push('/admin-login');
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Review and verify pending payment requests from users.
          </p>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Pending Transactions</h3>
            <Button 
              variant="default" 
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />
              }
              onClick={fetchPendingTransactions}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p>No pending transactions to verify.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Amount ($)</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell>{transaction.user?.name || 'Unknown'}</TableCell>
                      <TableCell>{transaction.user?.email || 'Unknown'}</TableCell>
                      <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.payment_method}</TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewReceipt(transaction)}
                                  disabled={!transaction.receipt_path}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Receipt</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleActionDialogOpen(transaction, 'approve')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Approve Payment</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleActionDialogOpen(transaction, 'reject')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reject Payment</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>
        <DialogContent className="max-h-[70vh] overflow-auto">
          {selectedTransaction?.receipt_path ? (
            <div className="flex flex-col items-center p-4">
              <img
                src={selectedTransaction.receipt_path}
                alt="Payment Receipt"
                className="max-w-full max-h-[50vh] object-contain"
              />
              <div className="mt-4 space-y-2 w-full">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono text-sm">{selectedTransaction.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">${selectedTransaction.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span>{selectedTransaction.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted By:</span>
                  <span>{selectedTransaction.user?.name}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No receipt available for this transaction.
            </p>
          )}
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => setReceiptDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            {actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
          </DialogTitle>
          <DialogDescription>
            An email notification will be sent to the user.
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <p className="py-4">
            {actionType === 'approve' 
              ? `Are you sure you want to approve the payment of $${selectedTransaction?.amount.toFixed(2)} for ${selectedTransaction?.user?.name}?`
              : `Are you sure you want to reject the payment of $${selectedTransaction?.amount.toFixed(2)} for ${selectedTransaction?.user?.name}?`
            }
          </p>
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => setActionDialogOpen(false)} disabled={processingAction}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransactionAction}
            className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            disabled={processingAction}
          >
            {processingAction ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}