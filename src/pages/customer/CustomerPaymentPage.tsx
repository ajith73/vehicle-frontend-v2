import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Wallet, Landmark, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

type PaymentState = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export default function CustomerPaymentPage() {
  const navigate = useNavigate();
  const [paymentState, setPaymentState] = useState<PaymentState>('PENDING');

  const handlePay = () => {
    setPaymentState('PROCESSING');
    setTimeout(() => {
      setPaymentState('PAID');
    }, 2000);
  };

  if (paymentState === 'PAID') {
    return (
      <div className="flex flex-col h-[100dvh] bg-background items-center justify-center p-4">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">Payment Successful</h1>
        <p className="text-muted-foreground font-medium mb-8 text-center max-w-xs">
          Thank you! ₹4,550 has been paid successfully to Ramesh K.
        </p>
        
        <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-4 mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-bold">TXN987654321</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Date</span>
            <span className="font-bold">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span className="font-bold">UPI</span>
          </div>
        </div>

        <Link to="/customer/request/123/rating" className="w-full max-w-sm bg-primary text-primary-foreground font-bold p-4 rounded-xl text-center shadow-lg hover:scale-105 transition-transform">
          Continue to Rating
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-foreground">Checkout</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        
        <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
               <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Service Summary</h3>
              <p className="text-sm text-muted-foreground">Battery Replacement</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Partner</span>
              <span className="font-bold">Ramesh K</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Parts</span>
              <span className="font-bold">₹4,200</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Labour</span>
              <span className="font-bold">₹300</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Taxes & Platform Fee</span>
              <span className="font-bold">₹50</span>
            </div>
          </div>

          <div className="h-[2px] bg-border my-4 border-dashed border-b border-t-0 border-r-0 border-l-0"></div>
          
          <div className="flex justify-between items-center mt-4">
            <span className="font-black text-xl">Total To Pay</span>
            <span className="font-black text-3xl text-primary">₹4,550</span>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4 pl-2">Select Payment Method</h3>
        
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-4 bg-card border-2 border-primary rounded-2xl p-4 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[100px]" />
            <input type="radio" name="payment" defaultChecked className="w-5 h-5 accent-primary" />
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <span className="font-black text-primary">UPI</span>
            </div>
            <div className="flex-1">
              <p className="font-bold">UPI / QR Code</p>
              <p className="text-xs text-muted-foreground mt-0.5">Google Pay, PhonePe, Paytm</p>
            </div>
          </label>

          <label className="flex items-center gap-4 bg-card border border-border hover:border-primary/50 rounded-2xl p-4 cursor-pointer">
            <input type="radio" name="payment" className="w-5 h-5 accent-primary" />
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
               <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Credit / Debit Card</p>
              <p className="text-xs text-muted-foreground mt-0.5">Visa, MasterCard, RuPay</p>
            </div>
          </label>

          <label className="flex items-center gap-4 bg-card border border-border hover:border-primary/50 rounded-2xl p-4 cursor-pointer">
            <input type="radio" name="payment" className="w-5 h-5 accent-primary" />
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
               <Landmark className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Net Banking</p>
              <p className="text-xs text-muted-foreground mt-0.5">All major Indian banks</p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 mt-6 justify-center text-xs text-muted-foreground font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          100% Secure Payments
        </div>

      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto w-full flex gap-4">
          <button 
            onClick={handlePay}
            disabled={paymentState === 'PROCESSING'}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground p-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100"
          >
            {paymentState === 'PROCESSING' ? (
              <span className="flex items-center gap-2 animate-pulse">Processing...</span>
            ) : (
              `Pay ₹4,550`
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
