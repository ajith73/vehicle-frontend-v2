import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, CheckCircle2, XCircle, HelpCircle, AlertTriangle } from 'lucide-react';

export default function CustomerQuotePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-foreground">Review Quotation</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Service Quotation</h2>
          <p className="text-muted-foreground font-medium">Your mechanic Ramesh K has inspected the vehicle and generated this quote.</p>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm mb-6">
          <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Problem Identified</h3>
          <p className="text-sm text-foreground/90 leading-relaxed mb-6">
            The battery is completely dead and cannot be jump-started. It needs a full replacement. We also need to clean the terminal connectors.
          </p>

          <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Recommended Service</h3>
          <p className="text-sm font-semibold text-foreground mb-6">
            Battery Replacement (Amaron 12V 45Ah) + Terminal Cleaning
          </p>

          <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Cost Breakdown</h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Parts (New Battery)</span>
              <span className="font-bold">₹4,200</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Labour (Installation)</span>
              <span className="font-bold">₹300</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Platform Fee</span>
              <span className="font-bold">₹50</span>
            </div>
          </div>

          <div className="h-[2px] bg-border my-4 border-dashed border-b border-t-0 border-r-0 border-l-0"></div>
          
          <div className="flex justify-between items-center mt-4">
            <span className="font-black text-xl">Total Amount</span>
            <span className="font-black text-3xl text-primary">₹4,550</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pb-8">
          <button onClick={() => navigate('/customer/request/123/payment')} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground p-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform">
            <CheckCircle2 className="w-6 h-6" /> APPROVE & CONTINUE
          </button>
          
          <button className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive p-4 rounded-xl font-bold hover:bg-destructive/20 transition-colors">
            <XCircle className="w-5 h-5" /> Reject Quote
          </button>

          <div className="flex gap-3 mt-2">
            <button className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-xl font-bold hover:bg-secondary/80 transition-colors text-sm">
              <HelpCircle className="w-4 h-4" /> Ask Mechanic
            </button>
            <Link to="/customer/support" className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-xl font-bold hover:bg-secondary/80 transition-colors text-sm">
              <AlertTriangle className="w-4 h-4" /> Support
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
