import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, CheckCircle2, XCircle, ChevronRight, Clock, Loader2, Calendar } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequestStatusMeta, isActiveRequestStatus, isCancelledRequestStatus, isCompletedRequestStatus } from '../../lib/requestLifecycle';

type Tab = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function CustomerRequestsHistoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ACTIVE');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiClient<any[]>('/customer/requests/history');
        setRequests(data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getFilteredRequests = () => {
    return requests.filter(req => {
      if (activeTab === 'COMPLETED') return isCompletedRequestStatus(req.status);
      if (activeTab === 'CANCELLED') return isCancelledRequestStatus(req.status);
      return isActiveRequestStatus(req.status);
    });
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border p-4 shadow-sm">
        <h1 className="text-xl font-black text-foreground mb-4">Your Requests</h1>
        
        {/* Tabs */}
        <div className="flex bg-secondary p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'ACTIVE' ? 'bg-background shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-foreground scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'COMPLETED' ? 'bg-background shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-foreground scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Completed
          </button>
          <button 
            onClick={() => setActiveTab('CANCELLED')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'CANCELLED' ? 'bg-background shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-foreground scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Cancelled
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">No {activeTab.toLowerCase()} requests</h3>
            <p className="text-muted-foreground text-sm mt-2">You don't have any requests in this category yet.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col gap-4"
            >
              {filteredRequests.map(req => (
                <Link 
                  key={req.id} 
                  to={`/customer/request/${req.id}`} 
                  className={`block bg-card/80 backdrop-blur-sm border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${activeTab === 'CANCELLED' ? 'opacity-75 border-border' : 'border-border/50 hover:border-primary/50'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-bold ${
                      activeTab === 'ACTIVE' ? 'bg-amber-500/10 text-amber-500' :
                      activeTab === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {activeTab === 'ACTIVE' && <Clock className="w-3 h-3" />}
                      {activeTab === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                      {activeTab === 'CANCELLED' && <XCircle className="w-3 h-3" />}
                      {getRequestStatusMeta(req.status).label}
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1">{req.issueSummary || 'Service Request'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{req.vehicleLabel || 'Vehicle not added'} • {req.Mechanic?.businessName || req.Mechanic?.name || 'Awaiting partner'}</p>
                  
                  {activeTab === 'ACTIVE' && (
                    <div className="flex items-center text-primary font-bold text-sm bg-primary/5 p-2 rounded-lg">
                      Track Status <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  )}

                  {activeTab === 'COMPLETED' && (
                    <div className="flex justify-between items-center border-t border-border/50 pt-4 mt-2">
                      <span className="font-black text-foreground text-lg">₹{req.finalAmount || req.quotationAmount || '0'}</span>
                      <div className="flex gap-2">
                        <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors" onClick={(e) => { e.preventDefault(); /* View invoice logic */ }}>Invoice</button>
                        <button className="text-xs font-bold text-secondary-foreground bg-secondary px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-colors" onClick={(e) => { e.preventDefault(); /* Rebook logic */ }}>Rebook</button>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
