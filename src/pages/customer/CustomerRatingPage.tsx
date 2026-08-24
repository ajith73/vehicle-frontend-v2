import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';

export default function CustomerRatingPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [metrics, setMetrics] = useState({
    professionalism: true,
    responseTime: true,
    serviceQuality: true,
    priceTransparency: true
  });

  const handleSubmit = () => {
    // In a real app, send API request here
    setSubmitted(true);
    setTimeout(() => {
      navigate('/customer'); // Return to home
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background items-center justify-center p-4 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">Thank You!</h1>
        <p className="text-muted-foreground font-medium max-w-xs">
          Your feedback helps us maintain high quality standards for our partners.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border p-4 text-center">
        <h1 className="text-lg font-black text-foreground">Rate Service</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32 flex flex-col items-center">
        
        <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden mb-4 mt-8">
          <img src="https://ui-avatars.com/api/?name=Ramesh+K&background=random" alt="Ramesh" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Ramesh K</h2>
        <p className="text-sm text-muted-foreground mb-8">Battery Replacement</p>

        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Overall Rating</h3>
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
            >
              <Star 
                className={`w-12 h-12 ${
                  (hoverRating || rating) >= star 
                    ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' 
                    : 'text-muted-foreground/30'
                } transition-all`} 
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4">What did you like?</h3>
              
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'professionalism', label: 'Professionalism' },
                  { id: 'responseTime', label: 'Response Time' },
                  { id: 'serviceQuality', label: 'Service Quality' },
                  { id: 'priceTransparency', label: 'Price Transparency' },
                ].map(metric => (
                  <button
                    key={metric.id}
                    onClick={() => setMetrics({...metrics, [metric.id]: !metrics[metric.id as keyof typeof metrics]})}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                      metrics[metric.id as keyof typeof metrics] 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80'
                    }`}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full mb-6">
              <label className="text-sm font-bold text-foreground block mb-2">Write a Review (Optional)</label>
              <textarea 
                placeholder="Share your experience..."
                className="w-full bg-card border border-border rounded-xl p-4 text-sm outline-none focus:border-primary transition-colors min-h-[120px]"
              />
            </div>

            <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 mb-8">
              <span className="font-bold text-foreground">Would you recommend Ramesh?</span>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                  <ThumbsDown className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto w-full flex gap-4">
          <button 
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full bg-primary text-primary-foreground p-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
