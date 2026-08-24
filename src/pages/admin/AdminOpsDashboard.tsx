import React, { useState, useEffect } from 'react';
import { Users, Wrench, AlertTriangle, TrendingUp, Activity, Loader2, Zap, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion } from 'framer-motion';

export default function AdminOpsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [automation, setAutomation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [data, automationData] = await Promise.all([
        apiClient<any>('/admin/dashboard'),
        apiClient<any>('/admin/automation/overview').catch(() => null)
      ]);
      setStats(data);
      setAutomation(automationData);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-black text-foreground mb-1">Operations Dashboard</h1>
        <p className="text-muted-foreground">Real-time overview of marketplace activity.</p>
      </motion.div>

      {/* Top KPIs */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
           <div className="flex items-center justify-between mb-4">
             <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
               <Activity className="w-5 h-5 text-primary" />
             </div>
           </div>
           <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Requests</p>
           <p className="text-3xl font-black text-foreground">{stats?.customerRequestCount || 0}</p>
         </div>

         <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
           <div className="flex items-center justify-between mb-4">
             <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
               <Wrench className="w-5 h-5 text-blue-500" />
             </div>
           </div>
           <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Partners</p>
           <p className="text-3xl font-black text-foreground">{stats?.totalMechanics || 0}</p>
         </div>

         <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
           <div className="flex items-center justify-between mb-4">
             <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
               <Users className="w-5 h-5 text-emerald-500" />
             </div>
             {stats?.pendingMechanics > 0 && (
               <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">{stats.pendingMechanics} pending</span>
             )}
           </div>
           <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Approved Partners</p>
           <p className="text-3xl font-black text-foreground">{stats?.approvedMechanics || 0}</p>
         </div>

         <div className="bg-card border border-border rounded-xl p-5 shadow-sm border-l-4 border-l-destructive hover:border-destructive/50 transition-colors">
           <div className="flex items-center justify-between mb-4">
             <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
               <AlertTriangle className="w-5 h-5 text-destructive" />
             </div>
             {stats?.pendingRequests > 0 && (
               <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">Requires attention</span>
             )}
           </div>
           <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending Updates</p>
           <p className="text-3xl font-black text-foreground">{stats?.pendingRequests || 0}</p>
         </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Re-dispatch Events</p>
          <p className="text-3xl font-black text-foreground">{automation?.metrics?.reDispatch || 0}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">No Supply</p>
          <p className="text-3xl font-black text-foreground">{automation?.metrics?.noPartnerFound || 0}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">SLA Breaches</p>
          <p className="text-3xl font-black text-foreground">{automation?.metrics?.slaBreaches || 0}</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm min-h-[300px]">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" /> Partners Onboarded (Last 10 Days)
          </h3>
          <div className="h-64 flex items-end justify-between gap-2 border-b border-border relative mt-4">
             {(stats?.mechanicsByDate || []).map((item: any, i: number) => {
               const maxCount = Math.max(...stats.mechanicsByDate.map((d: any) => d.count), 1);
               const heightPct = (item.count / maxCount) * 100;
               return (
                 <div key={i} className="w-full bg-primary/20 rounded-t hover:bg-primary transition-all cursor-pointer relative group flex flex-col justify-end" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                     {item.count} onboarded
                   </div>
                   <div className="text-[10px] text-muted-foreground -mb-5 absolute bottom-[-20px] left-1/2 -translate-x-1/2 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                     {item.date}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-card border border-border rounded-xl p-0 shadow-sm flex flex-col h-[350px]">
          <div className="p-4 border-b border-border bg-secondary/30">
            <h3 className="font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Activity
            </h3>
          </div>
          <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
             {stats?.recentActivities && stats.recentActivities.length > 0 ? (
               stats.recentActivities.map((log: any) => (
                 <div key={log.id} className="border-l-2 border-primary pl-3 pb-2">
                   <p className="text-sm font-bold">{log.action}</p>
                   <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                   <p className="text-[10px] text-muted-foreground mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                 </div>
               ))
             ) : (
               <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
             )}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
