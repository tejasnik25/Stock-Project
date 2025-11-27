'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, redirect } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Separator } from '@/components/ui/separator';
import UserLayout from '@/components/UserLayout';

interface AnalysisData {
  id: string;
  analysis_type: string;
  stock_name?: string;
  analysis_result?: string;
  image_path?: string;
  created_at: string;
}

const AnalysisDetailPageContent: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const analysisId = params.id as string;

  // Handle authentication check in useEffect
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [user, router]);

  // Server-side redirect
  if (!user && typeof window === 'undefined') {
    redirect('/login');
  }

  const loadAnalysisData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use localStorage to simulate data retrieval
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem('stock_analysis_db');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const currentUser = parsedData.users.find((u: { id: string }) => u.id === user?.id);
          
          if (currentUser && currentUser.analysis_history) {
            const foundAnalysis = currentUser.analysis_history.find((a: { id: string }) => a.id === analysisId);
            
            if (foundAnalysis) {
              setAnalysis(foundAnalysis);
            } else {
              setError('Analysis not found');
            }
          } else {
            setError('User data not found');
          }
        } else {
          setError('No data found');
        }
      }
    } catch (err) {
      setError('Failed to load analysis data');
      console.error('Error loading analysis:', err);
    } finally {
      setLoading(false);
    }
  }, [user, analysisId, setLoading, setError, setAnalysis]);

  useEffect(() => {
    loadAnalysisData();
  }, [router, analysisId, loadAnalysisData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Analysis...</h2>
          <p className="text-muted-foreground">Please wait while we retrieve your analysis details.</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">{error || 'Analysis Not Found'}</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'The requested analysis could not be found. It might have been deleted or you might not have access to it.'}
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analysis Details</h1>
        <Button onClick={() => router.push('/dashboard')} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
      
      <Card className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">
              {analysis.stock_name || 'Analysis Report'}
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analysis Type:</span>
                <span className="font-medium">{analysis.analysis_type}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created At:</span>
                <span className="font-medium">{formatDate(analysis.created_at)}</span>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-2">
              <h3 className="font-bold text-lg">Analysis Result</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {analysis.analysis_result || 'No analysis result available.'}
              </p>
            </div>
          </div>
          
          <div>
            {analysis.image_path && (
              <div className="rounded-lg overflow-hidden border shadow-sm h-full flex items-center justify-center">
                <img 
                  src={analysis.image_path} 
                  alt="Stock Market Graph" 
                  className="max-w-full max-h-[400px] object-contain"
                />
              </div>
            )}
            
            {!analysis.image_path && (
              <div className="rounded-lg border border-dashed h-full flex items-center justify-center p-8 bg-muted">
                <p className="text-muted-foreground text-center">
                  No image available for this analysis
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="secondary">Share Analysis</Button>
          <Button>Download PDF</Button>
        </div>
      </Card>
    </div>
  );
};

// Main page with UserLayout wrapper
const AnalysisDetailPage: React.FC = () => {
  return (
    <UserLayout>
      <AnalysisDetailPageContent />
    </UserLayout>
  );
};

export default AnalysisDetailPage;