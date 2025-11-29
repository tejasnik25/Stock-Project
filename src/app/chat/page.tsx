"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import UserLayout from '@/components/UserLayout';
import { useAuth } from '@/hooks/use-auth';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const strategy = (searchParams.get('strategy') || '').toLowerCase();
  const [fifteenMin, setFifteenMin] = useState<string>('');
  const [oneHour, setOneHour] = useState<string>('');
  const [fiveMin, setFiveMin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [tokensCharged, setTokensCharged] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [strategyPrice, setStrategyPrice] = useState<number | null>(null);
  const { user } = useAuth();
  const MIN_WALLET_BALANCE = 1.0; // Minimum required to use chatbox

  const strategyValid = useMemo(() => ['swing', 'scalp', 'day'].includes(strategy), [strategy]);

  useEffect(() => {
    if (!strategyValid) {
      router.replace('/strategies');
    }
  }, [strategyValid, router]);

  useEffect(() => {
    // Fetch the user's wallet balance and set state
    const fetchWallet = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/users?id=${encodeURIComponent(user.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.user?.wallet_balance === 'number') {
          setWalletBalance(data.user.wallet_balance);
        }
      } catch (err) {
        console.error('Failed to fetch wallet balance', err);
      }
    };
    fetchWallet();
  }, [user?.id]);

  useEffect(() => {
    // Fetch pricing for strategies
    const fetchPricing = async () => {
      try {
        const res = await fetch('/api/analysis/pricing');
        if (!res.ok) return;
        const data = await res.json();
        const pricingList = data.pricing || [];
        const strategyKeyToTypeMap: Record<string, string> = { swing: 'Swing Trading', scalp: 'Positional Trading', day: 'Intraday Trading' };
        const type = strategyKeyToTypeMap[strategy];
        const priceObj = pricingList.find((p: any) => p.analysis_type === type);
        setStrategyPrice(priceObj ? priceObj.price : 0);
      } catch (err) {
        console.error('Failed to fetch analysis pricing', err);
      }
    };
    fetchPricing();
  }, [strategy]);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Only images allowed'); return; }
    setError('');
    const base64 = await toBase64(f);
    // Client-side dimension check
    const img = new Image();
    img.onload = () => {
      if (img.width < 300 || img.height < 150) {
        setError('Uploaded image appears too small to be a chart. Please upload a larger chart image.');
        return;
      }
      setError('');
      setter(base64);
    };
    img.src = base64;
  };

  const run = async (save: boolean) => {
    if (!fifteenMin && !oneHour && !fiveMin) { setError('Upload at least one chart'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/analysis/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, inputs: { fifteenMin, oneHour, fiveMin }, save, userId: user?.id }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setError(data.error || 'Your account don\'t have "Engough"tokens, please top-up your wallet');
        // Optionally trigger a modal or toast here
        return;
      }

      if (res.status === 400) {
        // Provide helpful suggestions if validation fails
        if (data.error?.toLowerCase().includes('uploaded image appears invalid')) {
          const reason = data.error.split(':')[1]?.trim() || '';
          setError(`${data.error} ${reason ? '\n\nSuggestion: ' + reason : ''}`);
          return;
        }
        setError(data.error || 'Validation failed. Please check uploaded images and try again.');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Failed');

      setResult(data);
      // Update local wallet balance if returned
      if (typeof data.remainingBalance === 'number') {
        setWalletBalance(data.remainingBalance);
      }
      if (typeof data.tokensCharged === 'number') {
        setTokensCharged(data.tokensCharged);
      }

      if (save && data.id) {
        // redirect to analysis detail if saved
        router.push(`/analysis/${data.id}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Strategy Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {!strategyValid ? (
              <p>Select a strategy first.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Upload Charts</h3>
                  <p className="text-sm text-muted-foreground">Provide 15m, 1H, 5m charts (at least one).</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="block mb-2">15 Minute</Label>
                    <input type="file" accept="image/*" onChange={(e) => onFile(e, setFifteenMin)} />
                    {fifteenMin && <img src={fifteenMin} alt="15m" className="mt-2 max-h-40 object-contain" />}
                  </div>
                  <div>
                    <Label className="block mb-2">1 Hour</Label>
                    <input type="file" accept="image/*" onChange={(e) => onFile(e, setOneHour)} />
                    {oneHour && <img src={oneHour} alt="1h" className="mt-2 max-h-40 object-contain" />}
                  </div>
                  <div>
                    <Label className="block mb-2">5 Minute</Label>
                    <input type="file" accept="image/*" onChange={(e) => onFile(e, setFiveMin)} />
                    {fiveMin && <img src={fiveMin} alt="5m" className="mt-2 max-h-40 object-contain" />}
                  </div>
                </div>

                {error && <div className="text-red-600 whitespace-pre-line">{error}</div>}

                {/* Helpful upload suggestions */}
                <div className="mt-3 p-3 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  <div className="font-medium">Upload Hints</div>
                  <ul className="list-disc ml-5 text-xs mt-2">
                    <li>Supported formats: PNG, JPG, WebP, SVG</li>
                    <li>Minimum recommended size: 300x150 pixels</li>
                    <li>Include price & time axis or candlestick lines; crop out unrelated content</li>
                    <li>Avoid screenshots that are mostly whitespace</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center text-sm text-muted-foreground mr-4">
                    {strategyPrice !== null && (
                      <span>Tokens required: <b className="ml-1 text-white">{strategyPrice}</b></span>
                    )}
                  </div>
                  <Button onClick={() => run(false)} disabled={loading || walletBalance === null || (strategyPrice !== null && walletBalance < strategyPrice)}>{loading ? 'Analyzing...' : 'Analyze'}</Button>
                  <Button onClick={() => run(true)} variant="secondary" disabled={loading || walletBalance === null || (strategyPrice !== null && walletBalance < strategyPrice)}>Save Analysis</Button>
                  <Button onClick={() => router.push('/dashboard?tab=history')} variant="outline">History</Button>
                  <Button onClick={() => router.push('/dashboard')} variant="outline">Back</Button>
                </div>
                {(walletBalance !== null && walletBalance <= 0) && (
                  <div className="mt-3 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-800 text-sm text-red-800 dark:text-red-300">
                    Your wallet balance is ${walletBalance.toFixed(2)}. You must have a positive balance to use the chat. Please <button onClick={() => router.push('/wallet')} className="text-blue-600 hover:underline">Top up your wallet</button>.
                  </div>
                )}

                {result?.analysis && (
                  <div className="mt-6 space-y-3">
                    <div><b>Trade Setup:</b> {result.analysis.tradeSetup}</div>
                    <div><b>Entry Zone:</b> {result.analysis.entryZone}</div>
                    <div><b>SL:</b> {result.analysis.stopLoss}</div>
                    <div><b>TP:</b> {result.analysis.takeProfit}</div>
                    <div><b>R:R:</b> {result.analysis.riskReward}</div>
                    <div>
                      <b>Reason:</b>
                      <ul className="list-disc ml-6">
                        {result.analysis.reasons.map((r: string, idx: number) => (<li key={idx}>{r}</li>))}
                      </ul>
                    </div>
                  </div>
                )}
                {tokensCharged !== null && (
                  <div className="mt-3 text-sm text-white">Tokens charged: <b>{tokensCharged}</b></div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
