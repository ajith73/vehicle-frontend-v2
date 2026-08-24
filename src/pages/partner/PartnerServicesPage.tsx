import React, { useState } from 'react';
import { Settings2, Zap, PenTool, Battery, Fuel, Wrench, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PartnerServicesPage() {
  const [services, setServices] = useState([
    { id: '1', name: 'Battery Jump-start', icon: Zap, enabled: true, price: '₹300 - ₹500', radius: '10 km' },
    { id: '2', name: 'Flat Tyre Repair', icon: PenTool, enabled: true, price: '₹150 - ₹250', radius: '15 km' },
    { id: '3', name: 'Battery Replacement', icon: Battery, enabled: true, price: 'Estimate required', radius: '10 km' },
    { id: '4', name: 'Fuel Delivery', icon: Fuel, enabled: false, price: '₹200 + Fuel', radius: '5 km' },
    { id: '5', name: 'General Mechanic', icon: Wrench, enabled: true, price: 'Estimate required', radius: '20 km' },
  ]);

  const toggleService = (id: string) => {
    setServices(services.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center gap-3">
        <Link to="/partner/account" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-black text-foreground">My Services</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
           <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
           <p className="text-sm text-primary font-medium leading-relaxed">
             Only verified services are shown here. Contact support to request approval for additional service categories.
           </p>
        </div>

        <div className="flex flex-col gap-4">
           {services.map(service => (
             <div key={service.id} className={`bg-card border-2 transition-colors rounded-[2rem] p-5 shadow-sm ${service.enabled ? 'border-primary/50 bg-primary/5' : 'border-border opacity-70 grayscale-[50%]'}`}>
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${service.enabled ? 'bg-primary/20' : 'bg-secondary'}`}>
                      <service.icon className={`w-6 h-6 ${service.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                   </div>
                   <div>
                     <h3 className="font-bold text-lg text-foreground leading-tight">{service.name}</h3>
                     <p className={`text-xs font-bold mt-1 ${service.enabled ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                       {service.enabled ? 'ACTIVE' : 'INACTIVE'}
                     </p>
                   </div>
                 </div>
                 
                 {/* Toggle Switch */}
                 <button 
                   onClick={() => toggleService(service.id)}
                   className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${service.enabled ? 'bg-primary' : 'bg-secondary border border-border'}`}
                 >
                   <div className={`w-4 h-4 rounded-full bg-white transition-transform ${service.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
               </div>
               
               <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 bg-background p-3 rounded-xl border border-border">
                 <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Pricing</p>
                   <p className="text-sm font-bold text-foreground">{service.price}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Service Radius</p>
                   <p className="text-sm font-bold text-foreground">{service.radius}</p>
                 </div>
               </div>

               {service.enabled && (
                 <button className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-bold py-3 rounded-xl hover:bg-secondary/80 transition-colors text-sm">
                   <Settings2 className="w-4 h-4" /> Configure Rules
                 </button>
               )}
             </div>
           ))}
        </div>
      </main>
    </div>
  );
}
