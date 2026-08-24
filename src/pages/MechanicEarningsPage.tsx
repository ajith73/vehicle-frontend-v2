import React, { useState, useEffect } from 'react';
import { SEO } from '../components/SEO';
import { apiClient } from '../api/apiClient';
import { IndianRupee, Clock, CheckCircle } from 'lucide-react';

interface PartnerEarning {
  id: number;
  grossAmount: number;
  platformFeeDeduction: number;
  netEarningAmount: number;
  status: string;
  createdAt: string;
  CustomerRequest?: {
    id: number;
    status: string;
    issueSummary: string;
    vehicleLabel: string;
  };
  PayoutSettlement?: {
    id: number;
    status: string;
    processedAt: string;
    bankReference: string;
  };
}

export default function MechanicEarningsPage() {
  const [earnings, setEarnings] = useState<PartnerEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const data = await apiClient<PartnerEarning[]>('/mechanic/earnings');
        setEarnings(data);
      } catch (error) {
        console.error('Failed to load earnings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const totalEarnings = earnings.reduce((acc, curr) => acc + curr.netEarningAmount, 0);
  const pendingSettlement = earnings
    .filter(e => e.status === 'PENDING_SETTLEMENT')
    .reduce((acc, curr) => acc + curr.netEarningAmount, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse font-medium">Loading earnings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-24">
      <SEO title="Earnings & Payouts | RoadResQ Partner" />
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground">Earnings & Payouts</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track your completed jobs, platform deductions, and settlement status.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-muted-foreground">
              <IndianRupee className="h-5 w-5" />
              <h3 className="font-bold">Total Net Earnings</h3>
            </div>
            <p className="mt-4 text-4xl font-black text-foreground">₹{totalEarnings.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-primary">
              <Clock className="h-5 w-5" />
              <h3 className="font-bold">Pending Settlement</h3>
            </div>
            <p className="mt-4 text-4xl font-black text-primary">₹{pendingSettlement.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Recent Jobs</h2>
          {earnings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              No earnings recorded yet.
            </div>
          ) : (
            earnings.map(earning => (
              <div key={earning.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Request #{earning.CustomerRequest?.id} - {earning.CustomerRequest?.vehicleLabel}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(earning.createdAt).toLocaleDateString()} • {earning.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-foreground">₹{earning.netEarningAmount.toFixed(2)}</p>
                    {earning.platformFeeDeduction > 0 && (
                      <p className="text-xs text-destructive">
                        -₹{earning.platformFeeDeduction.toFixed(2)} platform fee
                      </p>
                    )}
                  </div>
                </div>
                {earning.PayoutSettlement && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/30 p-3 text-xs text-secondary-foreground">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      Settlement #{earning.PayoutSettlement.id} processed on {new Date(earning.PayoutSettlement.processedAt || '').toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
