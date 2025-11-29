"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiFolder, FiTrendingUp } from "react-icons/fi";
import { FaFire } from "react-icons/fa";

import Button from "@/components/ui/Button";
import UserLayout from "@/components/UserLayout";

// Types for running and listed strategies
type RunningStrategy = {
  id: string;
  name: string;
  orders: any[];
  profit: number;
};

type ListedStrategy = {
  id: string;
  name: string;
  description: string;
  performance: number;
  riskLevel: "Low" | "Medium" | "High";
  category: "Growth" | "Income" | "Momentum" | "Value";
  imageUrl: string;
};

// Dashboard page content
function DashboardPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'history' ? 'history' : (tabParam ? tabParam : 'history'));
  const [running, setRunning] = useState<RunningStrategy[]>([]);
  const [listed, setListed] = useState<ListedStrategy[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingRunning, setLoadingRunning] = useState(true);
  const [loadingListed, setLoadingListed] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (tabParam === 'history') {
      setActiveTab('history');
    }
  }, [tabParam]);

  // Fetch running strategies
  useEffect(() => {
    const fetchRunning = async () => {
      try {
        const response = await fetch("/api/strategies/running");
        const data = await response.json();
        setRunning(data.strategies || []);
      } catch (error) {
        console.error("Error fetching running strategies:", error);
        setRunning([]);
      } finally {
        setLoadingRunning(false);
      }
    };
    fetchRunning();
  }, []);

  // Fetch listed strategies (enabled)
  useEffect(() => {
    const fetchListed = async () => {
      try {
        const response = await fetch("/api/strategies");
        const data = await response.json();
        const enabled = (data.strategies || []).filter((s: any) => s.enabled !== false);
        setListed(enabled);
      } catch (error) {
        console.error("Error fetching listed strategies:", error);
        setListed([]);
      } finally {
        setLoadingListed(false);
      }
    };
    fetchListed();
  }, []);

  // Fetch pricing (tokens) for strategies
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch('/api/analysis/pricing');
        const data = await res.json();
        setPricing(data.pricing || []);
      } catch (err) {
        console.error('Failed to fetch pricing', err);
        setPricing([]);
      }
    };
    fetchPricing();
  }, []);

  // Fetch history
  useEffect(() => {
    if (activeTab === 'history') {
      setLoadingHistory(true);
      const fetchHistory = async () => {
        try {
          const response = await fetch("/api/analysis/history");
          const data = await response.json();
          setHistory(data.history || []);
        } catch (error) {
          console.error("Error fetching history:", error);
          setHistory([]);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab]);

  // Metrics removed per request

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with greeting */}
      <div className="bg-gradient-to-br from-[#101b2d] to-[#0e1726] rounded-2xl p-4 md:p-6 border border-[#1b2e4b] shadow-2xl shadow-black/30 transform-gpu">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2 rounded-full">
              <FaFire className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white">Hey! {session?.user?.name?.split(" ")[0] || "User"}</h2>
              <p className="text-xs md:text-sm text-gray-400">Welcome back</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={`px-3 py-1 rounded-md text-xs md:text-sm ${activeTab === "day" ? "bg-[#00d09c] text-white" : "bg-[#0e1726] text-gray-400"}`}
              onClick={() => setActiveTab("day")}
            >
              Day
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs md:text-sm ${activeTab === "week" ? "bg-[#00d09c] text-white" : "bg-[#0e1726] text-gray-400"}`}
              onClick={() => setActiveTab("week")}
            >
              Week
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs md:text-sm ${activeTab === "month" ? "bg-[#00d09c] text-white" : "bg-[#0e1726] text-gray-400"}`}
              onClick={() => setActiveTab("month")}
            >
              Month
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs md:text-sm ${activeTab === "history" ? "bg-[#00d09c] text-white" : "bg-[#0e1726] text-gray-400"}`}
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Metrics removed */}

      {activeTab === 'history' ? (
        <div className="bg-gradient-to-br from-[#101b2d] to-[#0e1726] rounded-2xl p-4 md:p-6 border border-[#1b2e4b] shadow-2xl shadow-black/30 transform-gpu">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-6">Analysis History</h2>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[#00d09c]" />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item: any) => {
                let parsed: any = item.analysis_result;
                try {
                  if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                } catch (e) {
                  // keep string if parsing fails
                }
                return (
                  <div key={item.id} className="bg-[#0e1726] p-4 rounded-xl border border-[#22304d]">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-white">{item.analysis_type}</h3>
                        <p className="text-sm text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <Link href={`/analysis/${item.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                    {/* Show detailed summary inline */}
                    {parsed && typeof parsed === 'object' && (
                      <div className="mt-4 text-sm text-gray-300 space-y-2">
                        {item.priceCharged !== undefined && (
                          <div><b>Tokens charged:</b> {item.priceCharged}</div>
                        )}
                        <div><b>Summary:</b> {parsed.summary}</div>
                        <div><b>Trade Setup:</b> {parsed.tradeSetup}</div>
                        <div><b>Entry Zone:</b> {parsed.entryZone}</div>
                        <div><b>SL:</b> {parsed.stopLoss}</div>
                        <div><b>TP:</b> {parsed.takeProfit}</div>
                        <div><b>R:R:</b> {parsed.riskReward}</div>
                        <div>
                          <b>Reasons:</b>
                          <ul className="list-disc ml-6">
                            {Array.isArray(parsed.reasons) ? parsed.reasons.map((r: string, idx: number) => <li key={idx}>{r}</li>) : null}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No history found.</div>
          )}
        </div>
      ) : (
        /* Two partitions: Running & Listed */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Running strategies */}
          <div className="bg-gradient-to-br from-[#101b2d] to-[#0e1726] rounded-2xl p-4 md:p-6 border border-[#1b2e4b] shadow-2xl shadow-black/30 transform-gpu">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-white">Current Positions</h2>
              <Link href="/strategies/running" className="text-[#00d09c] text-sm hover:underline">
                View all
              </Link>
            </div>
            {loadingRunning ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[#00d09c]" />
              </div>
            ) : running.length > 0 ? (
              <div className="flex flex-col gap-4">
                {running.slice(0, 4).map((strategy) => (
                  <Link
                    key={strategy.id}
                    href={`/strategies/${strategy.id}/info`}
                    className="bg-gradient-to-br from-[#0e1726] to-[#1b2e4b] rounded-xl p-4 md:p-5 border border-[#22304d] shadow-xl shadow-black/40 transition-transform transform-gpu hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="bg-[#172238] p-3 rounded-lg shadow-inner">
                          <FiTrendingUp className="h-5 w-5 text-[#00d09c]" />
                        </div>
                        <h3 className="font-medium text-white text-sm md:text-base truncate">{strategy.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 md:gap-8 text-xs md:text-sm w-full sm:w-auto flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                        <div>
                          <p className="text-gray-400">Orders</p>
                          <p className="text-white text-right">{strategy.orders?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Profit</p>
                          <p className={`${strategy.profit > 0 ? "text-green-500" : strategy.profit < 0 ? "text-red-500" : "text-white"} text-right`}>
                            ${strategy.profit?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-[#0e1726] p-4 rounded-full mb-4">
                  <FiFolder className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-white mb-2">Nothing to show</h3>
                <p className="text-gray-400 mb-4">You don't have any running strategies yet.</p>
                <Link href="/strategies">
                  <Button variant="primary">Browse Strategies</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Listed strategies */}
          <div className="bg-gradient-to-br from-[#101b2d] to-[#0e1726] rounded-2xl p-4 md:p-6 border border-[#1b2e4b] shadow-2xl shadow-black/30 transform-gpu">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-white">Listed Strategies</h2>
              <Link href="/strategies" className="text-[#00d09c] text-sm hover:underline">
                View all
              </Link>
            </div>
            {loadingListed ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[#00d09c]" />
              </div>
            ) : listed.length > 0 ? (
              <div className="flex flex-col gap-4">
                {listed.slice(0, 4).map((s) => (
                  <Link
                    key={s.id}
                    href={`/strategies/${s.id}/info`}
                    className="bg-gradient-to-br from-[#0e1726] to-[#1b2e4b] rounded-xl p-4 md:p-5 border border-[#22304d] shadow-xl shadow-black/40 transition-transform transform-gpu hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="bg-[#172238] p-3 rounded-lg shadow-inner">
                          <FiTrendingUp className="h-5 w-5 text-[#a855f7]" />
                        </div>
                        <h3 className="font-medium text-white text-sm md:text-base truncate">{s.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 md:gap-8 text-xs md:text-sm w-full sm:w-auto flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                        <div>
                          <p className="text-gray-400">Category</p>
                          <p className="text-white text-right">{s.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Performance</p>
                          <p className="text-green-500 text-right">{s.performance}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Tokens</p>
                          <p className="text-white text-right">{
                            (() => {
                              const idToType: any = { swing: 'Swing Trading', scalp: 'Positional Trading', day: 'Intraday Trading' };
                              const key = idToType[s.id] || (s.name && s.name.includes('Swing') ? 'Swing Trading' : s.name && s.name.includes('Intraday') ? 'Intraday Trading' : 'Positional Trading');
                              const p = pricing.find((pp: any) => pp.analysis_type === key);
                              return p ? p.price : '-';
                            })()
                          }</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-[#0e1726] p-4 rounded-full mb-4">
                  <FiFolder className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-white mb-2">No strategies found</h3>
                <p className="text-gray-400 mb-4">Explore and deploy strategies from the catalog.</p>
                <Link href="/strategies">
                  <Button variant="primary">Explore Strategies</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="bg-[#283046] rounded-lg p-4 mt-6">
        <p className="text-xs text-gray-400 text-center">
          Stock Market investments are subject to market risk. Please read the offer documents carefully before investing. Past performances are no guarantee of future returns. This content is solely for educational purposes only.
        </p>
        <p className="text-xs text-green-500 text-right mt-1">Disclaimer</p>
      </div>
    </div>
  );
}

// Dashboard page
export default function Dashboard() {
  return (
    <UserLayout>
      <DashboardPageContent />
    </UserLayout>
  );
}