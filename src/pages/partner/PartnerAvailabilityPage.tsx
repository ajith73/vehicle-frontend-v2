import React, { useState } from 'react';
import { ChevronLeft, Power, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';

type Status = 'ONLINE' | 'BUSY' | 'PAUSED' | 'OFFLINE';

export default function PartnerAvailabilityPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('ONLINE');

  const updateStatus = async (newStatus: Status) => {
    try {
      if (newStatus === 'ONLINE') {
        await apiClient('/mechanic/live/go-online', { method: 'POST', data: { latitude: 11.0168, longitude: 76.9558 } });
      } else if (newStatus === 'OFFLINE') {
        await apiClient('/mechanic/live/go-offline', { method: 'POST' });
      }
      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate('/partner/account')} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-xl font-black text-foreground">Availability</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        
        {/* Current Status */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card border border-border rounded-[2rem] p-6 shadow-sm mb-6 flex flex-col items-center text-center">
          <motion.div animate={{ scale: status === 'ONLINE' ? [1, 1.1, 1] : 1 }} transition={{ duration: 2, repeat: status === 'ONLINE' ? Infinity : 0 }} className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border-4 shadow-lg ${
            status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
            status === 'BUSY' ? 'bg-amber-500/10 border-amber-500 text-amber-500' :
            status === 'PAUSED' ? 'bg-blue-500/10 border-blue-500 text-blue-500' :
            'bg-secondary border-muted text-muted-foreground'
          }`}>
            <Power className="w-10 h-10" />
          </motion.div>
          <h2 className="font-black text-2xl text-foreground mb-1">
             {status === 'ONLINE' ? 'You are Online' :
              status === 'BUSY' ? 'You are Busy' :
              status === 'PAUSED' ? 'Paused' : 'Offline'}
          </h2>
          <p className="text-sm font-semibold text-muted-foreground">
             {status === 'ONLINE' ? 'Receiving new service requests.' :
              status === 'BUSY' ? 'Currently on an active job. Not receiving new requests.' :
              status === 'PAUSED' ? 'On a break. Not receiving requests for 30 mins.' : 'Not receiving any requests.'}
          </p>
        </motion.div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Change Status</h3>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col gap-3 mb-8">
           <button 
             onClick={() => updateStatus('ONLINE')}
             className={`p-4 rounded-xl border-2 flex items-center justify-between transition-colors ${status === 'ONLINE' ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_4px_15px_rgba(16,185,129,0.1)]' : 'border-border bg-card hover:border-emerald-500/50'}`}
           >
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-full bg-emerald-500" />
                 <span className="font-bold text-foreground">Online</span>
              </div>
              {status === 'ONLINE' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
           </button>

           <button 
             onClick={() => updateStatus('PAUSED')}
             className={`p-4 rounded-xl border-2 flex items-center justify-between transition-colors ${status === 'PAUSED' ? 'border-blue-500 bg-blue-500/5 shadow-[0_4px_15px_rgba(59,130,246,0.1)]' : 'border-border bg-card hover:border-blue-500/50'}`}
           >
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-full bg-blue-500" />
                 <span className="font-bold text-foreground">Pause (30 mins)</span>
              </div>
              {status === 'PAUSED' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
           </button>

           <button 
             onClick={() => updateStatus('OFFLINE')}
             className={`p-4 rounded-xl border-2 flex items-center justify-between transition-colors ${status === 'OFFLINE' ? 'border-muted-foreground bg-secondary shadow-sm' : 'border-border bg-card hover:border-muted-foreground/50'}`}
           >
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-full bg-muted-foreground" />
                 <span className="font-bold text-foreground">Offline</span>
              </div>
              {status === 'OFFLINE' && <CheckCircle2 className="w-5 h-5 text-muted-foreground" />}
           </button>
        </motion.div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Settings</h3>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
           <div className="p-4 border-b border-border flex items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                   <Clock className="w-5 h-5 text-muted-foreground" />
                 </div>
                 <div>
                   <h4 className="font-bold text-sm">Working Hours</h4>
                   <p className="text-xs text-muted-foreground">Always On</p>
                 </div>
              </div>
           </div>
           <div className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                   <MapPin className="w-5 h-5 text-muted-foreground" />
                 </div>
                 <div>
                   <h4 className="font-bold text-sm">Service Area</h4>
                   <p className="text-xs text-muted-foreground">Dynamic (Based on location)</p>
                 </div>
              </div>
           </div>
        </motion.div>

      </main>
    </motion.div>
  );
}
