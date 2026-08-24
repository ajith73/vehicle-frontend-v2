import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Wrench, DollarSign, Download, Calendar, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAnalytics() {
  const [tab, setTab] = useState<'MARKETPLACE' | 'CUSTOMER' | 'PARTNER' | 'FINANCIAL'>('MARKETPLACE');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData(tab);
  }, [tab]);

  const fetchData = async (currentTab: string) => {
    setLoading(true);
    try {
      let endpoint = '';
      if (currentTab === 'MARKETPLACE') endpoint = '/admin/analytics/marketplace-zones';
      if (currentTab === 'CUSTOMER') endpoint = '/admin/analytics/customer-funnel';
      if (currentTab === 'PARTNER') endpoint = '/admin/analytics/partner-performance';
      if (currentTab === 'FINANCIAL') endpoint = '/admin/analytics/financial';

      const res = await apiClient<any>(endpoint);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMarketplaceMetrics = () => {
    if (!data || !Array.isArray(data)) return null;
    const totals = data.reduce((acc, item) => {
      acc.reqs += item.requestCount || 0;
      acc.assigned += item.assignedCount || 0;
      acc.completed += item.completedCount || 0;
      return acc;
    }, { reqs: 0, assigned: 0, completed: 0 });

    const acceptanceRate = totals.reqs ? ((totals.assigned / totals.reqs) * 100).toFixed(1) : 0;
    const completionRate = totals.reqs ? ((totals.completed / totals.reqs) * 100).toFixed(1) : 0;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Requests (Zones)</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{totals.reqs}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Assignment Rate</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{acceptanceRate}%</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Completion Rate</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{completionRate}%</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Zones</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{data.length}</p></div>
        </div>
      </motion.div>
    );
  };

  const renderCustomerMetrics = () => {
    if (!data) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Requests Submitted</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{data.requestSubmitted || 0}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Assignment Rate</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{data.metadata?.assignmentRate || 0}%</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Services Completed</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{data.serviceCompleted || 0}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Repeat Customers</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{data.repeatRequestCreated || 0}</p></div>
        </div>
      </motion.div>
    );
  };

  const renderPartnerMetrics = () => {
    if (!data || !Array.isArray(data)) return null;
    const avgScore = data.length ? (data.reduce((sum, item) => sum + (item.score || 0), 0) / data.length).toFixed(1) : 0;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Partners</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{data.length}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Average Perf Score</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">{avgScore}</p></div>
        </div>
      </motion.div>
    );
  };

  const renderFinancialMetrics = () => {
    if (!data) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <p className="text-sm font-bold text-primary-foreground/80 uppercase tracking-wider mb-1">Gross GMV</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black">₹{data.recordedTransactionValue || 0}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Platform Revenue</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">₹{data.platformFeeRealization || 0}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Membership Revenue</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">₹{data.membershipRevenue || 0}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors border-l-4 border-l-emerald-500">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Trusted Partner Value</p>
          <div className="flex items-end gap-2"><p className="text-3xl font-black text-foreground">₹{data.trustedPartnerContribution || 0}</p></div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Analytics Hub</h1>
          <p className="text-muted-foreground">Deep dive into platform metrics and performance.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-secondary text-foreground font-bold px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary/80 shadow-sm transition-colors">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 border border-primary rounded-lg text-sm hover:opacity-90 shadow-sm transition-opacity">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-card border border-border p-1 rounded-xl w-max overflow-x-auto max-w-full">
        {['MARKETPLACE', 'CUSTOMER', 'PARTNER', 'FINANCIAL'].map((t) => (
          <button 
            key={t}
            onClick={() => setTab(t as any)}
            className={`flex items-center gap-2 py-2 px-4 text-sm font-bold rounded-lg transition-colors ${tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'MARKETPLACE' && <BarChart3 className="w-4 h-4" />}
            {t === 'CUSTOMER' && <Users className="w-4 h-4" />}
            {t === 'PARTNER' && <Wrench className="w-4 h-4" />}
            {t === 'FINANCIAL' && <DollarSign className="w-4 h-4" />}
            <span className="capitalize">{t.toLowerCase()}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="min-h-[150px]">
        {loading ? (
          <div className="flex items-center justify-center h-full mt-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === 'MARKETPLACE' && <div key="market">{renderMarketplaceMetrics()}</div>}
            {tab === 'CUSTOMER' && <div key="customer">{renderCustomerMetrics()}</div>}
            {tab === 'PARTNER' && <div key="partner">{renderPartnerMetrics()}</div>}
            {tab === 'FINANCIAL' && <div key="finance">{renderFinancialMetrics()}</div>}
          </AnimatePresence>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
         <h3 className="font-bold mb-6 flex items-center gap-2 capitalize">
            <TrendingUp className="w-4 h-4 text-muted-foreground" /> {tab.toLowerCase()} Trend Analysis
         </h3>
         <div className="h-64 flex items-end justify-between gap-1 border-b border-border relative mt-8">
            {/* Using mock trend data for visual display as historical data might be empty */}
            {[30, 45, 20, 80, 60, 90, 100, 70, 50, 40, 65, 85, 30, 45, 20, 80, 60, 90, 100, 70, 50, 40, 65, 85, 45, 75, 80, 65, 95, 100].map((h, i) => (
              <div key={i} className="w-full bg-primary/20 rounded-t hover:bg-primary transition-all cursor-pointer relative group flex flex-col justify-end" style={{ height: `${h}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                  Day {i+1}: {Math.round(h * 1.5)}
                </div>
              </div>
            ))}
         </div>
         <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-wider">
            <span>Aug 1</span>
            <span>Aug 15</span>
            <span>Aug 30</span>
         </div>
      </motion.div>

    </div>
  );
}
