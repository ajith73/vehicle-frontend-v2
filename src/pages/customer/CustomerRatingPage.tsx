import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';

export default function CustomerRatingPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [requestTitle, setRequestTitle] = useState('Battery Replacement');
  const [partnerName, setPartnerName] = useState('Ramesh');
  const [reviewText, setReviewText] = useState('');
  const [recommendation, setRecommendation] = useState<'yes' | 'no' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mechanicId, setMechanicId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('RoadResQ Customer');
  const [customerEmail, setCustomerEmail] = useState('customer@roadresq.local');

  const [metrics, setMetrics] = useState({
    professionalism: true,
    responseTime: true,
    serviceQuality: true,
    priceTransparency: true
  });

  useEffect(() => {
    if (!id) return;

    const loadRequest = async () => {
      try {
        const [request, profile] = await Promise.all([
          apiClient<any>(`/customer/requests/${id}/status`),
          apiClient<any>('/customer/profile').catch(() => null)
        ]);
        setRequestTitle(request?.issueSummary || 'Completed service');
        setPartnerName(request?.Mechanic?.businessName || request?.Mechanic?.name || 'your partner');
        setMechanicId(Number(request?.Mechanic?.id || request?.mechanicId || 0) || null);
        if (profile?.name) {
          setCustomerName(String(profile.name));
        }
        if (profile?.email) {
          setCustomerEmail(String(profile.email));
        }
      } catch {
        // Keep friendly fallbacks if the request lookup fails.
      }
    };

    void loadRequest();
  }, [id]);

  const handleSubmit = async () => {
    if (!mechanicId) {
      toast.error('Partner details are still loading. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      const visitorId = localStorage.getItem('roadresq.customer.visitor-id') || `customer-${Date.now()}`;
      localStorage.setItem('roadresq.customer.visitor-id', visitorId);

      await apiClient(`/public/mechanics/${mechanicId}/reviews`, {
        method: 'POST',
        data: {
          name: customerName,
          email: customerEmail,
          visitorId,
          fingerprint: navigator.userAgent || visitorId,
          ratingTimeliness: rating,
          ratingFairness: rating,
          ratingRecommendation: recommendation === 'yes' ? 5 : recommendation === 'no' ? 1 : rating,
          isProblemFixed: recommendation !== 'no',
          comments: reviewText.trim() || undefined
        }
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate('/customer');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
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
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=random`} alt={partnerName} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">{partnerName}</h2>
        <p className="text-sm text-muted-foreground mb-8">{requestTitle}</p>

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
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                className="w-full bg-card border border-border rounded-xl p-4 text-sm outline-none focus:border-primary transition-colors min-h-[120px]"
              />
            </div>

            <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 mb-8">
              <span className="font-bold text-foreground">Would you recommend {partnerName}?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecommendation('yes')}
                  aria-pressed={recommendation === 'yes'}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                    recommendation === 'yes'
                      ? 'scale-105 border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_rgba(59,130,246,0.18)]'
                      : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRecommendation('no')}
                  aria-pressed={recommendation === 'no'}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                    recommendation === 'no'
                      ? 'scale-105 border-destructive bg-destructive text-destructive-foreground shadow-[0_0_0_3px_rgba(239,68,68,0.18)]'
                      : 'border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20'
                  }`}
                >
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
            disabled={rating === 0 || submitting}
            className="w-full bg-primary text-primary-foreground p-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
