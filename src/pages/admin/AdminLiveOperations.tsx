import React, { useState, useEffect } from 'react';
import { MapPin, Filter, X, User, Car, Clock, Navigation, AlertTriangle, Search, Phone, Wrench, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getRequestStatusMeta, getRequestToneClasses, isSearchingRequestStatus } from '../../lib/requestLifecycle';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function AdminLiveOperations() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    try {
      const [reqs, mechs] = await Promise.all([
        apiClient<any[]>('/admin/live/requests'),
        apiClient<any[]>('/admin/live/mechanics')
      ]);
      setRequests(reqs || []);
      setMechanics(mechs || []);
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (id: number) => {
    try {
      await apiClient(`/admin/requests/${id}/cancel`, {
        method: 'POST',
        data: { reason: 'Admin override' }
      });
      toast.success('Request cancelled successfully');
      fetchLiveData();
      setSelectedEntity(null);
    } catch (error) {
      toast.error('Failed to cancel request');
    }
  };

  const getEntityDetails = () => {
    if (!selectedEntity) return null;
    if (selectedEntity.startsWith('req-')) {
      const id = parseInt(selectedEntity.split('-')[1]);
      const req = requests.find(r => r.id === id);
      if (!req) return null;
      return { type: 'request', data: req };
    }
    if (selectedEntity.startsWith('mech-')) {
      const id = parseInt(selectedEntity.split('-')[1]);
      const mech = mechanics.find(m => m.id === id);
      if (!mech) return null;
      return { type: 'mechanic', data: mech };
    }
    return null;
  };

  const entityDetails = getEntityDetails();

  // Simple mock distribution of map pins since we don't have a real map renderer
  const getMapPosition = (index: number, total: number, isMech: boolean) => {
    // Generate pseudo-random but stable positions
    const seed = index * 137 + (isMech ? 1 : 0);
    const top = 20 + (seed % 60); // 20% to 80%
    const left = 10 + ((seed * 7) % 80); // 10% to 90%
    return { top: `${top}%`, left: `${left}%` };
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-background border border-border rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-background relative border border-border rounded-xl overflow-hidden shadow-sm">
      
      {/* Top Filter Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
         <div className="bg-background/90 backdrop-blur-md border border-border rounded-lg shadow-md p-2 flex items-center gap-3 flex-1 max-w-2xl">
           <Search className="w-4 h-4 text-muted-foreground ml-2" />
           <input 
             type="text" 
             placeholder="Search by ID, Customer, or Partner..." 
             className="bg-transparent border-none outline-none text-sm w-full font-medium"
             value={filter}
             onChange={(e) => setFilter(e.target.value)}
           />
           <div className="h-4 w-px bg-border"></div>
           <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-secondary rounded-md hover:bg-secondary/80 whitespace-nowrap transition-colors">
             <Filter className="w-3 h-3" /> Filters
           </button>
         </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-secondary relative overflow-hidden z-0">
         <MapContainer center={[11.0168, 76.9558]} zoom={13} className="w-full h-full">
           <TileLayer
             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
             url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
           />
           {requests.filter(r => !filter || String(r.id).includes(filter) || r.CustomerUser?.CustomerProfile?.displayName?.toLowerCase().includes(filter.toLowerCase())).map((req) => {
             const lat = req.latitude || 11.0168 + (Math.random() - 0.5) * 0.05;
             const lng = req.longitude || 76.9558 + (Math.random() - 0.5) * 0.05;
             return (
               <Marker 
                 key={`req-${req.id}`} 
                 position={[lat, lng]} 
                 eventHandlers={{ click: () => setSelectedEntity(`req-${req.id}`) }}
               >
                 <Popup>
                   <div className="font-bold">REQ-{req.id}</div>
                   <div className="text-sm">{getRequestStatusMeta(req.status).label}</div>
                 </Popup>
               </Marker>
             );
           })}
           {mechanics.filter(m => m.isOnline && (!filter || String(m.id).includes(filter) || m.businessName?.toLowerCase().includes(filter.toLowerCase()))).map((mech) => {
             const lat = mech.latitude || 11.0168 + (Math.random() - 0.5) * 0.05;
             const lng = mech.longitude || 76.9558 + (Math.random() - 0.5) * 0.05;
             return (
               <Marker 
                 key={`mech-${mech.id}`} 
                 position={[lat, lng]}
                 eventHandlers={{ click: () => setSelectedEntity(`mech-${mech.id}`) }}
               >
                 <Popup>
                   <div className="font-bold">{mech.businessName || mech.name}</div>
                   <div className="text-sm">{mech.availabilityState || 'ONLINE'}</div>
                 </Popup>
               </Marker>
             );
           })}
         </MapContainer>
      </div>

      {/* Side Panel */}
      <div className={`absolute top-0 right-0 bottom-0 w-96 bg-card border-l border-border shadow-2xl transition-transform duration-300 z-30 ${selectedEntity ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur">
          <h2 className="font-black">Live Details</h2>
          <button onClick={() => setSelectedEntity(null)} className="p-1 hover:bg-secondary rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto h-[calc(100%-60px)]">
          {entityDetails?.type === 'request' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <div className="flex items-center gap-2 mb-4">
                 <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${getRequestToneClasses(entityDetails.data.status)}`}>
                   {getRequestStatusMeta(entityDetails.data.status).label}
                 </span>
                 <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                   <Clock className="w-3 h-3" /> {new Date(entityDetails.data.createdAt).toLocaleTimeString()}
                 </span>
               </div>

               <h3 className="font-bold text-xl mb-1">{entityDetails.data.ServiceType?.name || 'Assistance'}</h3>
               <p className="text-sm text-muted-foreground mb-6">REQ-{entityDetails.data.id}</p>

               <div className="space-y-4 mb-6">
                 <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
                   <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg border border-border">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                       <div>
                         <p className="text-sm font-bold">{entityDetails.data.CustomerUser?.CustomerProfile?.displayName || 'Unknown'}</p>
                         <p className="text-xs text-muted-foreground">{entityDetails.data.vehicleLabel || 'Vehicle'}</p>
                       </div>
                     </div>
                     <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"><Phone className="w-4 h-4" /></button>
                   </div>
                 </div>

                 <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                   <div className="bg-secondary/50 p-3 rounded-lg border border-border text-sm font-medium flex items-start gap-2">
                     <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                     {entityDetails.data.addressText || 'Location not specified'}
                   </div>
                 </div>
               </div>

               <div className="border-t border-border pt-4">
                 <h4 className="font-bold text-sm mb-3">Admin Actions</h4>
                 <div className="flex flex-col gap-2">
                   <button className="w-full bg-primary text-primary-foreground font-bold p-3 rounded-lg shadow text-sm hover:opacity-90 transition-opacity">
                     Dispatch Manually
                   </button>
                   <button onClick={() => handleCancelRequest(entityDetails.data.id)} className="w-full text-destructive font-bold p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-sm hover:bg-destructive/10 transition-colors">
                     Cancel Request
                   </button>
                 </div>
               </div>
            </motion.div>
          )}

          {entityDetails?.type === 'mechanic' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <div className="flex items-center gap-2 mb-4">
                 <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${entityDetails.data.availabilityState === 'ONLINE_BUSY' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                   {entityDetails.data.availabilityState || 'ONLINE'}
                 </span>
               </div>

               <h3 className="font-bold text-xl mb-1">{entityDetails.data.businessName || entityDetails.data.name}</h3>
               <p className="text-sm text-muted-foreground mb-6">Partner #{entityDetails.data.id} • {entityDetails.data.city}</p>

               <div className="space-y-4 mb-6">
                 <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
                   <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg border border-border">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center"><Phone className="w-4 h-4 text-emerald-500" /></div>
                       <div>
                         <p className="text-sm font-bold">{entityDetails.data.phone || 'N/A'}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="border-t border-border pt-4">
                 <h4 className="font-bold text-sm mb-3">Admin Actions</h4>
                 <div className="flex flex-col gap-2">
                   <button className="w-full bg-secondary text-foreground font-bold p-3 rounded-lg border border-border text-sm hover:bg-secondary/80 transition-colors">
                     View Full Profile
                   </button>
                 </div>
               </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
