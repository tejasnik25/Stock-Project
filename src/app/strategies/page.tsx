'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs, { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import UserLayout from '@/components/UserLayout';

import {
  FiInfo,
  FiPlay
} from 'react-icons/fi';

import { Strategy, getAllStrategies } from '@/db/dbService';

// No need for mock data - we'll fetch from the database

const StrategiesPageContent: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch strategies from the database
  useEffect(() => {
    const fetchStrategies = () => {
      try {
        // Force a fresh read from localStorage to get the latest strategies
        if (typeof window !== 'undefined') {
          // Clear any cached data
          localStorage.removeItem('strategies_cache');
        }
        
        // Get all strategies from the database with a fresh read
        const allStrategies = getAllStrategies();
        setStrategies(allStrategies);
      } catch (error) {
        console.error('Error fetching strategies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStrategies();
    
    // Set up a refresh interval to check for new strategies
    const refreshInterval = setInterval(fetchStrategies, 5000);
    
    // Clean up the interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const handleViewInfo = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
  };
  
  const closeStrategyInfo = () => {
    setSelectedStrategy(null);
  };

  const handleDeploy = (strategy: Strategy) => {
    // Redirect to chatbox with strategy ID
    router.push(`/dashboard?tab=chat&strategy=${strategy.id}`);
  };

  const filteredStrategies = activeTab === 'all' 
    ? strategies 
    : strategies.filter(strategy => strategy.category.toLowerCase() === activeTab);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading Strategies</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {session?.user?.name}
          </span>
        </div>
      </div>
      
      {/* Strategy Info Modal */}
      <Dialog open={!!selectedStrategy} onOpenChange={(open) => !open && setSelectedStrategy(null)}>
        <DialogContent className="max-w-3xl">
          {selectedStrategy && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedStrategy.name}</DialogTitle>
                <DialogDescription className="text-base">{selectedStrategy.description}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                  <Image
                    src={selectedStrategy.imageUrl}
                    alt={selectedStrategy.name}
                    width={200}
                    height={200}
                    className="absolute inset-0 w-full h-full object-contain p-6"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Strategy Details</h3>
                  <p>{selectedStrategy.details}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Parameters</h3>
                    <ul className="space-y-2">
                      {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                        <li key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Performance:</span>
                        <span className={`font-medium ${selectedStrategy.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedStrategy.performance >= 0 ? '+' : ''}{selectedStrategy.performance}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risk Level:</span>
                        <span className="font-medium">{selectedStrategy.riskLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">{selectedStrategy.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleDeploy(selectedStrategy)}>
                  <FiPlay className="mr-2" />
                  Deploy Strategy
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
          
          <div className="space-y-6">
            {/* Strategy categories tabs */}
            <div className="bg-card rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Strategy Categories</h2>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full md:w-auto grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="growth">Growth</TabsTrigger>
                  <TabsTrigger value="value">Value</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Strategies grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // Loading state
                Array(3).fill(0).map((_, index) => (
                  <Card key={`loading-${index}`} className="overflow-hidden">
                    <div className="h-48 bg-muted animate-pulse"></div>
                    <CardHeader>
                      <CardTitle className="h-6 bg-muted animate-pulse rounded w-3/4"></CardTitle>
                      <CardDescription className="h-4 bg-muted animate-pulse rounded mt-2"></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="w-full h-4 bg-muted animate-pulse rounded"></div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-muted animate-pulse rounded-full w-1/2"></div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex space-x-2">
                      <div className="flex-1 h-9 bg-muted animate-pulse rounded"></div>
                      <div className="flex-1 h-9 bg-muted animate-pulse rounded"></div>
                    </CardFooter>
                  </Card>
                ))
              ) : strategies.length === 0 ? (
                // Empty state
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">No strategies available at this time.</p>
                </Card>
              ) : filteredStrategies.map((strategy) => (
                <Card key={strategy.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300">
                    <Image
                      src={strategy.imageUrl}
                      alt={strategy.name}
                      width={200}
                      height={200}
                      className="absolute inset-0 w-full h-full object-contain p-6"
                    />
                    <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      {strategy.riskLevel}
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{strategy.name}</CardTitle>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${strategy.performance >= 0 ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-red-600 bg-red-100 dark:bg-red-900/30'}`}>
                        {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
                      </span>
                    </div>
                    <CardDescription>{strategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <span className="text-sm font-medium capitalize">{strategy.category}</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${strategy.performance >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min(Math.abs(strategy.performance) * 3, 100)}%` }}
                      ></div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex space-x-2">
                    <Button 
                      variant="outline"
                      className="flex-1 flex items-center justify-center"
                      onClick={() => handleViewInfo(strategy)}
                    >
                      <FiInfo className="mr-2" />
                      Info
                    </Button>
                    <Button 
                      variant="default"
                      className="flex-1 flex items-center justify-center"
                      onClick={() => handleDeploy(strategy)}
                    >
                      <FiPlay className="mr-2" />
                      Deploy
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Strategy info modal (simplified as conditional rendering) */}
          {selectedStrategy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5">
                  <Image
                    src={selectedStrategy.imageUrl}
                    alt={selectedStrategy.name}
                    width={300}
                    height={300}
                    className="absolute inset-0 w-full h-full object-contain p-8"
                  />
                  <Button 
                    variant="outline" 
                    className="absolute top-2 right-2 p-2 h-auto"
                    onClick={() => setSelectedStrategy(null)}
                  >
                    ✕
                  </Button>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-2xl">{selectedStrategy.name}</CardTitle>
                    <span className={`text-sm font-semibold px-2 py-1 rounded ${selectedStrategy.performance >= 0 ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-red-600 bg-red-100 dark:bg-red-900/30'}`}>
                      {selectedStrategy.performance >= 0 ? '+' : ''}{selectedStrategy.performance}%
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {selectedStrategy.category}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full">
                      Risk: {selectedStrategy.riskLevel}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Strategy Details</h3>
                    <p className="text-muted-foreground">{selectedStrategy.details}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Parameters</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                        <div key={key} className="p-2 bg-muted/50 rounded">
                          <span className="text-sm font-medium">{key}</span>
                          <p className="text-sm text-muted-foreground">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      handleDeploy(selectedStrategy);
                      setSelectedStrategy(null);
                    }}
                  >
                    <FiPlay className="mr-2 h-4 w-4" /> Deploy Strategy
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      );
};

// Main page with UserLayout wrapper
const StrategiesPage: React.FC = () => {
  return (
    <UserLayout>
      <StrategiesPageContent />
    </UserLayout>
  );
};

export default StrategiesPage;