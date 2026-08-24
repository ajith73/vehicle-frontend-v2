import { useEffect, useState } from 'react';
import { ChevronLeft, ExternalLink, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { Mechanic } from '../../types';

export default function PartnerVerificationPage() {
  const navigate = useNavigate();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const mechanicId = localStorage.getItem('mechanicId');
      if (!mechanicId) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiClient<Mechanic>(`/public/mechanics/${mechanicId}`);
        setMechanic(data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load verification status');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const verificationStatus = mechanic?.pendingVerification?.status || (mechanic?.verificationLevel ? 'APPROVED' : 'PENDING');

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate('/partner/account')} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">Verification</h1>
          <p className="text-xs font-semibold text-muted-foreground">Business proof, identity, and trust readiness</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full pb-32">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !mechanic ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            Partner verification is not linked yet. Login again with your mechanic account to connect your verification flow.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Trust Status</p>
                  <h2 className="mt-2 text-2xl font-black text-foreground">{mechanic.businessName || mechanic.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Track verification level, pending review state, and next actions for partner activation quality.</p>
                </div>
                <div className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wider ${verificationStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700' : verificationStatus === 'Rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-700'}`}>
                  {verificationStatus}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification level</p>
                <p className="mt-2 text-3xl font-black text-foreground">{mechanic.verificationLevel || 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trusted partner</p>
                <p className="mt-2 text-lg font-black text-foreground">{mechanic.isTrustedPartner ? 'Enabled' : 'Not yet enabled'}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Review remark</p>
                <p className="mt-2 text-sm text-muted-foreground">{mechanic.pendingVerification?.remarks || mechanic.rejectionReason || 'No reviewer remark yet'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                {verificationStatus === 'APPROVED' ? <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" /> : <TriangleAlert className="w-5 h-5 text-amber-500 mt-0.5" />}
                <div>
                  <h3 className="font-bold text-foreground">Next step</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {verificationStatus === 'APPROVED'
                      ? 'Your core verification is approved. You can still update supporting documents or improve trust signals from the partner account.'
                      : 'Open the verification flow to upload or refresh your business, owner, service, and proof details.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={`/verify-flow/${mechanic.id}`} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Open verification flow
              </Link>
              <Link to="/partner/documents" className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:border-primary/40">
                Review documents
              </Link>
              <Link to={`/mechanic/${mechanic.id}`} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:border-primary/40 inline-flex items-center gap-2">
                Public profile <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
