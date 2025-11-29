'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Badge from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Input from '@/components/ui/Input';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, RefreshCw, Eye, Mail, Loader2, FileText, History, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'deposit' | 'charge';
  payment_method?: string;
  transaction_id?: string;
  receipt_path?: string;
  platform?: 'MT4' | 'MT5';
  mt_account_id?: string;
  mt_account_password?: string;
  terms_accepted?: boolean;
  status: 'pending' | 'in-process' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
  admin_id?: string;
  rejection_reason?: string;
  user?: {
    name: string;
    email: string;
  };
  admin_message?: string;
  admin_message_status?: 'pending' | 'sent' | 'resolved';
  history?: Array<{ timestamp: string; admin_id?: string; status: string; reason?: string; credited_amount?: number }>;
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [approveTokens, setApproveTokens] = useState<number | string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    fetchTransactions(activeTab);
  }, [activeTab]);

  // SSE subscription to update transactions in real-time
  useEffect(() => {
    const source = new EventSource('/api/events/wallet');
    source.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d && d.type === 'transaction_update' && d.transaction) {
          setTransactions(prev => {
            const idx = prev.findIndex(t => t.id === d.transaction.id);
            if (idx === -1) return [d.transaction, ...prev];
            const clone = [...prev];
            clone[idx] = d.transaction;
            return clone;
          });
        }
      } catch (err) {
        // ignore
      }
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, []);

  const fetchTransactions = async (status: 'pending' | 'history') => {
    setLoading(true);
    setError(null);

    try {
      // Get transactions based on status
      const response = await fetch(`/api/admin/transactions?status=${status}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      // Sort by date (newest first)
      data.transactions.sort((a: Transaction, b: Transaction) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setTransactions(data.transactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async () => {
    if (!selectedTransaction || !actionType) return;

    setProcessingAction(true);
    setError(null);

    try {
      let response: Response;
      if (actionType === 'approve') {
        // Use transactions endpoint (PUT) to approve and optionally provide tokens to credit user
        response = await fetch(`/api/admin/transactions/${selectedTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved', tokens: Number(approveTokens) || selectedTransaction.amount }),
        });
      } else {
        // Reject with a required reason
        if (!rejectionReason || rejectionReason.trim().length === 0) {
          throw new Error('Please provide a rejection reason');
        }
        response = await fetch(`/api/admin/transactions/${selectedTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected', rejectionReason }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      const result = await response.json();

      // Optimistic update: remove from list if in pending tab, or update if in history
      if (activeTab === 'pending') {
        setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
      } else {
        setTransactions(prev => prev.map(t => t.id === selectedTransaction.id ? result.transaction : t));
      }

      // Close dialog
      setActionDialogOpen(false);
      setRejectionReason('');

      toast({
        variant: 'default',
        title: 'Success',
        description: actionType === 'approve'
          ? `Transaction approved and tokens credited to user account`
          : 'Transaction rejected successfully'
      });
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

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(true);
  };

  const handleActionDialogOpen = (transaction: Transaction, action: 'approve' | 'reject') => {
    setSelectedTransaction(transaction);
    setActionType(action);
    setRejectionReason('');
    setApproveTokens(transaction.amount);
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
        <CardContent className="pt-6">
          <Tabs defaultValue="pending" value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'history')}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="pending" className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Pending
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center">
                  <History className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <Button
                variant="default"
                size="sm"
                onClick={() => fetchTransactions(activeTab)}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <TabsContent value="pending" className="mt-0">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <p>No pending transactions to verify.</p>
                </div>
              ) : (
                <TransactionTable
                  transactions={transactions}
                  onViewReceipt={handleViewReceipt}
                  onViewDetails={handleViewDetails}
                  onApprove={(t) => handleActionDialogOpen(t, 'approve')}
                  onReject={(t) => handleActionDialogOpen(t, 'reject')}
                  formatDate={formatDate}
                  showActions={true}
                />
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <p>No transaction history found.</p>
                </div>
              ) : (
                <TransactionTable
                  transactions={transactions}
                  onViewReceipt={handleViewReceipt}
                  onViewDetails={handleViewDetails}
                  onApprove={(t) => handleActionDialogOpen(t, 'approve')}
                  onReject={(t) => handleActionDialogOpen(t, 'reject')}
                  formatDate={formatDate}
                  showActions={false}
                />
              )}
            </TabsContent>
          </Tabs>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Approve this payment and credit tokens equal to the payment amount`
                : 'Provide a reason and confirm rejection of this payment.'}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Amount</Label>
                <div className="col-span-3">
                  <span className="font-medium">${selectedTransaction.amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">User</Label>
                <div className="col-span-3">
                  <span className="font-medium">{selectedTransaction.user?.name}</span>
                  <span className="block text-sm text-gray-500">{selectedTransaction.user?.email}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Date</Label>
                <div className="col-span-3">
                  <span className="font-medium">
                    {formatDate(selectedTransaction.created_at)}
                  </span>
                </div>
              </div>
              {actionType === 'reject' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rejectionReason" className="text-right">Reason</Label>
                  <Input
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason"
                    className="col-span-3"
                  />
                </div>
              )}
              {actionType === 'approve' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="approveTokens" className="text-right">Tokens</Label>
                  <Input
                    id="approveTokens"
                    value={approveTokens}
                    onChange={(e) => setApproveTokens(Number(e.target.value) || '')}
                    placeholder="Enter tokens to credit"
                    className="col-span-3"
                    type="number"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button
              onClick={handleTransactionAction}
              variant={actionType === 'approve' ? 'default' : 'primary'}
              disabled={processingAction || (actionType === 'reject' && (!rejectionReason || rejectionReason.trim().length === 0))}
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                actionType === 'approve' ? 'Approve' : 'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              MT4/MT5 account information and terms acceptance.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Platform</Label>
                <div className="col-span-3">
                  <span className="font-medium">{selectedTransaction.platform || '-'}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">MT Account ID</Label>
                <div className="col-span-3">
                  <span className="font-mono text-sm">{selectedTransaction.mt_account_id || '-'}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">MT Account Password</Label>
                <div className="col-span-3">
                  <span className="font-mono text-sm">{selectedTransaction.mt_account_password || '-'}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Terms Accepted</Label>
                <div className="col-span-3">
                  {selectedTransaction.terms_accepted ? (
                    <Badge>Accepted</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3">
                  {selectedTransaction.status === 'pending' ? (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                  ) : selectedTransaction.status === 'in-process' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Process</Badge>
                  ) : selectedTransaction.status === 'completed' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
                  )}
                </div>
              </div>
              {selectedTransaction.rejection_reason && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-red-600">Rejection Reason</Label>
                  <div className="col-span-3">
                    <span className="text-red-600">{selectedTransaction.rejection_reason}</span>
                  </div>
                </div>
              )}
              {selectedTransaction.history && selectedTransaction.history.length > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">History</Label>
                  <div className="col-span-3">
                    <div className="text-sm text-gray-300 space-y-2">
                      {selectedTransaction.history.map((h: any, idx: number) => (
                        <div key={idx} className="bg-[#0b1220] p-2 rounded">
                          <div className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</div>
                          <div className="text-sm">Status: <span className="font-medium">{h.status}</span></div>
                          {h.admin_id && <div className="text-sm">Admin: <span className="font-medium">{h.admin_id}</span></div>}
                          {h.reason && <div className="text-sm text-red-300">Reason: {h.reason}</div>}
                          {typeof h.credited_amount === 'number' && <div className="text-sm">Credited: ${h.credited_amount}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionTable({
  transactions,
  onViewReceipt,
  onViewDetails,
  onApprove,
  onReject,
  formatDate,
  showActions
}: {
  transactions: Transaction[],
  onViewReceipt: (t: Transaction) => void,
  onViewDetails: (t: Transaction) => void,
  onApprove: (t: Transaction) => void,
  onReject: (t: Transaction) => void,
  formatDate: (d: string) => string,
  showActions: boolean
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Amount ($)</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell>{transaction.platform || '-'}</TableCell>
              <TableCell>
                {transaction.status === 'pending' ? (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                ) : transaction.status === 'in-process' ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Process</Badge>
                ) : transaction.status === 'completed' ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
                )}
              </TableCell>
              <TableCell>{formatDate(transaction.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8"
                          onClick={() => onViewReceipt(transaction)}
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
                          variant="outline"
                          size="sm"
                          className="h-8 w-8"
                          onClick={() => onViewDetails(transaction)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View Details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {showActions && transaction.status === 'pending' && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => onApprove(transaction)}
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
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => onReject(transaction)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reject Payment</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}