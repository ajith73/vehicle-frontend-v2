import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, Send, Camera, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PartnerQuotePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [items, setItems] = useState([
    { id: Date.now().toString(), label: 'Battery (Amaron 45Ah)', category: 'PART', unitAmount: 4200, quantity: 1 }
  ]);
  const [notes, setNotes] = useState('Battery needs full replacement.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = items.reduce((sum, item) => sum + (item.unitAmount * item.quantity), 0);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), label: 'New Item', category: 'LABOR', unitAmount: 0, quantity: 1 }]);
  };

  const removeItem = (idToRemove: string) => {
    setItems(items.filter(i => i.id !== idToRemove));
  };

  const updateItem = (idToUpdate: string, field: string, value: any) => {
    setItems(items.map(i => i.id === idToUpdate ? { ...i, [field]: value } : i));
  };

  const handleSend = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (items.some(i => !i.label.trim() || i.unitAmount <= 0)) {
      toast.error('Please fill out all items with valid amounts');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient(`/mechanic/jobs/${id}/quote`, {
        method: 'POST',
        data: {
          lineItems: items,
          notes: notes,
          taxAmount: 0,
          feeAmount: 0,
          pricingMode: 'QUOTE_REQUIRED'
        }
      });
      toast.success('Quote sent to customer successfully!');
      navigate(`/partner/request/${id}`);
    } catch (err) {
      toast.error('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-black text-foreground">Create Quote</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">Inspection Details</h3>
          
          <label className="text-sm font-bold text-foreground block mb-2">Description</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl p-4 text-sm outline-none focus:border-primary transition-colors min-h-[100px] mb-4"
          />

          <label className="text-sm font-bold text-foreground block mb-2">Attach Photos</label>
          <div className="flex gap-2">
             <button className="w-20 h-20 rounded-xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors">
                <Camera className="w-6 h-6 mb-1" />
             </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Line Items</h3>
            <button onClick={addItem} className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-primary/20 transition-colors">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          
          <div className="flex flex-col gap-3 mb-4">
             {items.map((item) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={item.id} className="flex flex-col gap-2 bg-secondary/50 p-3 rounded-xl border border-border">
                   <div className="flex justify-between items-start gap-2">
                     <div className="flex-1">
                       <input 
                         type="text" 
                         value={item.label} 
                         onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                         placeholder="Item Name"
                         className="w-full bg-transparent font-bold outline-none text-sm border-b border-border/50 focus:border-primary pb-1 transition-colors" 
                       />
                     </div>
                     <button onClick={() => removeItem(item.id)} className="text-destructive/50 hover:text-destructive p-1 transition-colors">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                     <select 
                       value={item.category}
                       onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                       className="text-[10px] font-bold uppercase px-1.5 py-1 rounded bg-background border border-border outline-none"
                     >
                       <option value="PART">Part</option>
                       <option value="LABOR">Labor</option>
                       <option value="FEE">Fee</option>
                     </select>
                     <div className="flex-1"></div>
                     <div className="flex items-center gap-1 bg-background rounded border border-border px-2 py-1">
                        <span className="text-muted-foreground text-xs font-bold">₹</span>
                        <input 
                          type="number"
                          value={item.unitAmount}
                          onChange={(e) => updateItem(item.id, 'unitAmount', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-transparent text-right font-bold text-sm outline-none"
                        />
                     </div>
                   </div>
                </motion.div>
             ))}
          </div>

          <div className="h-[1px] bg-border my-4"></div>
          
          <div className="flex justify-between items-center">
            <span className="font-black text-lg">Total Quote</span>
            <span className="font-black text-2xl text-primary">₹{total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">+ Platform fees will be added by RoadResQ.</p>
        </div>

      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-lg mx-auto w-full flex gap-3">
          <button 
            onClick={handleSend}
            disabled={isSubmitting}
            className={`flex-1 ${isSubmitting ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:scale-[1.02]'} text-primary-foreground p-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(var(--primary),0.3)] transition-all flex items-center justify-center gap-2`}
          >
            <Send className="w-5 h-5" /> {isSubmitting ? 'Sending...' : 'Send to Customer'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
