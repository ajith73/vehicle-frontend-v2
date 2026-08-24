import React, { useState, useEffect } from 'react';
import { SEO } from '../components/SEO';
import { apiClient } from '../api/apiClient';
import { toast } from 'react-hot-toast';
import { Landmark, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface Settlement {
  id: number;
  status: string;
  totalAmount: number;
  currencyCode: string;
  processedAt: string | null;
  bankReference: string | null;
  notes: string | null;
  createdAt: string;
  Mechanic?: {
    id: number;
    businessName: string;
    name: string;
  };
  PartnerEarnings?: Array<{
    id: number;
    netEarningAmount: number;
    status: string;
  }>;
}

export default function AdminSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchSettlements = async () => {
    try {
      const data = await apiClient<Settlement[]>('/admin/finance/settlements');
      setSettlements(data);
    } catch (error) {
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleProcessSettlement = async (id: number) => {
    const bankRef = window.prompt('Enter Bank Reference ID for this payout:');
    if (!bankRef) return;

    setProcessingId(id);
    try {
      await apiClient(`/admin/finance/settlements/${id}/process`, {
        method: 'POST',
        data: {
          status: 'COMPLETED',
          bankReference: bankRef
        }
      });
      toast.success('Settlement processed successfully');
      fetchSettlements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process settlement');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading settlements...</p>
      </div>
    );
  }

  const pendingCount = settlements.filter(s => s.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <SEO title="Settlements | Admin | RoadResQ" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Partner Settlements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and process payout settlements for mechanics.</p>
        </div>
        <button
          onClick={fetchSettlements}
          className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Settlements</p>
          <p className="mt-2 text-3xl font-black text-foreground">{pendingCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-bold">Settlement ID</th>
                <th className="px-6 py-4 font-bold">Partner</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settlements.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 font-mono">#{settlement.id}</td>
                  <td className="px-6 py-4 font-medium">
                    {settlement.Mechanic?.businessName || settlement.Mechanic?.name}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    ₹{settlement.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      settlement.status === 'COMPLETED' ? 'bg-secondary/20 text-secondary-foreground' : 'bg-primary/20 text-primary'
                    }`}>
                      {settlement.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {settlement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {settlement.status === 'PENDING' ? (
                      <button
                        onClick={() => handleProcessSettlement(settlement.id)}
                        disabled={processingId === settlement.id}
                        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Landmark className="h-4 w-4" />
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Ref: {settlement.bankReference}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No settlements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
