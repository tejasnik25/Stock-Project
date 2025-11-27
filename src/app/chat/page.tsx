"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import UserLayout from '@/components/UserLayout';
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
  const [error, setError] = useState<string>('');

  const strategyValid = useMemo(() => ['swing','scalp','day'].includes(strategy), [strategy]);

  useEffect(() => {
    if (!strategyValid) {
      router.replace('/strategies');
    }
  }, [strategyValid, router]);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string)=>void) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Only images allowed'); return; }
    setError('');
    setter(await toBase64(f));
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
        body: JSON.stringify({ strategy, inputs: { fifteenMin, oneHour, fiveMin }, save }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      if (save && data.id) {
        // redirect to analysis detail if saved
        router.push(`/analysis/${data.id}`);
      }
    } catch (e:any) {
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
                    <input type="file" accept="image/*" onChange={(e)=>onFile(e,setFifteenMin)} />
                    {fifteenMin && <img src={fifteenMin} alt="15m" className="mt-2 max-h-40 object-contain" />}
                  </div>
                  <div>
                    <Label className="block mb-2">1 Hour</Label>
                    <input type="file" accept="image/*" onChange={(e)=>onFile(e,setOneHour)} />
                    {oneHour && <img src={oneHour} alt="1h" className="mt-2 max-h-40 object-contain" />}
                  </div>
                  <div>
                    <Label className="block mb-2">5 Minute</Label>
                    <input type="file" accept="image/*" onChange={(e)=>onFile(e,setFiveMin)} />
                    {fiveMin && <img src={fiveMin} alt="5m" className="mt-2 max-h-40 object-contain" />}
                  </div>
                </div>

                {error && <div className="text-red-600">{error}</div>}

                <div className="flex gap-3">
                  <Button onClick={()=>run(false)} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</Button>
                  <Button onClick={()=>run(true)} variant="secondary" disabled={loading}>Save Analysis</Button>
                  <Button onClick={()=>router.push('/dashboard')} variant="outline">Back</Button>
                </div>

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
                        {result.analysis.reasons.map((r:string, idx:number)=>(<li key={idx}>{r}</li>))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
