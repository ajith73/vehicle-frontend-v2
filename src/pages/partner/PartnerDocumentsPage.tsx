import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ExternalLink, FileBadge2, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { Mechanic } from '../../types';

export default function PartnerDocumentsPage() {
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
        toast.error(error.message || 'Failed to load document status');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const documentEntries = useMemo(() => {
    const checklist = (mechanic?.verificationChecklist || {}) as Record<string, unknown>;
    return Object.entries(checklist)
      .filter(([key, value]) => !key.startsWith('__') && (typeof value === 'string' || typeof value === 'boolean'))
      .map(([key, value]) => ({
        key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(),
        value,
        isLink: typeof value === 'string' && /^https?:\/\//i.test(value),
      }));
  }, [mechanic]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate('/partner/account')} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">Documents</h1>
          <p className="text-xs font-semibold text-muted-foreground">Verification files and submitted proofs</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full pb-32">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !mechanic ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            Mechanic profile not linked yet. Login again as a partner so the app can attach your mechanic account.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Partner Files</p>
                  <h2 className="mt-2 text-2xl font-black text-foreground">{mechanic.businessName || mechanic.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Review your uploaded documents, verification links, and approval-related checklist items.</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-700">
                  Level {mechanic.verificationLevel || 0}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {documentEntries.length === 0 ? (
                <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                  No document checklist items are available yet. Use the verification flow to add or update them.
                </div>
              ) : (
                documentEntries.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        {typeof item.value === 'boolean' ? <ShieldCheck className="w-5 h-5 text-primary" /> : <FileBadge2 className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground">{item.label}</p>
                        {typeof item.value === 'boolean' ? (
                          <p className={`mt-2 text-sm font-semibold ${item.value ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.value ? 'Verified' : 'Pending verification'}
                          </p>
                        ) : item.isLink ? (
                          <a href={String(item.value)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline break-all">
                            Open document link <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground break-words">{String(item.value)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/partner/verification" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Open verification
              </Link>
              {mechanic.id ? (
                <Link to={`/mechanic-dashboard/${mechanic.id}`} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:border-primary/40">
                  Open legacy dashboard
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
