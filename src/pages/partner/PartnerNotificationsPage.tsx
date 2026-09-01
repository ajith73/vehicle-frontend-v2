import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, DollarSign, Filter, RefreshCw, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import EmptyStateCard from '../../components/common/EmptyStateCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import MetricCard from '../../components/common/MetricCard';

const PARTNER_NOTIFICATION_READ_KEY = 'roadresq.partner.notification-read';

type PartnerNotification = {
  id: string;
  type: 'ALERT' | 'SUCCESS' | 'WARNING' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  read: boolean;
  source: string;
};

type FilterMode = 'ALL' | 'UNREAD';

export default function PartnerNotificationsPage() {
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');

  const getStoredReadIds = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PARTNER_NOTIFICATION_READ_KEY) || '[]');
      return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const persistReadIds = (ids: Set<string>) => {
    localStorage.setItem(PARTNER_NOTIFICATION_READ_KEY, JSON.stringify(Array.from(ids)));
  };

  const applyReadState = (items: PartnerNotification[]) => {
    const storedReadIds = getStoredReadIds();
    return (items || []).map((item) => ({
      ...item,
      read: item.read || storedReadIds.has(String(item.id))
    }));
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiClient<PartnerNotification[]>('/mechanic/notifications');
      setNotifications(applyReadState(data || []));
      setConnectionLost(false);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error: any) {
      toast.error(error.message || 'Failed to load partner notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();

    const closeStream = openRealtimeStream<PartnerNotification[]>('/mechanic/notifications', {
      event: 'mechanic:notifications:update',
      onMessage: (payload) => {
        setNotifications(applyReadState(Array.isArray(payload) ? payload : []));
        setLoading(false);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
      },
      onError: async () => {
        setConnectionLost(true);
        try {
          const data = await apiClient<PartnerNotification[]>('/mechanic/notifications');
          setNotifications(applyReadState(data || []));
          setLastUpdatedAt(new Date().toISOString());
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      closeStream();
    };
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const filteredNotifications = useMemo(
    () => (filterMode === 'UNREAD' ? notifications.filter((item) => !item.read) : notifications),
    [filterMode, notifications]
  );
  const lastUpdatedLabel = useMemo(
    () => (lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('en-IN') : null),
    [lastUpdatedAt]
  );

  const markAllRead = () => {
    const ids = getStoredReadIds();
    notifications.forEach((item) => ids.add(String(item.id)));
    persistReadIds(ids);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const markRead = (id: string) => {
    const ids = getStoredReadIds();
    ids.add(String(id));
    persistReadIds(ids);
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const iconForType = (type: PartnerNotification['type']) => {
    if (type === 'SUCCESS') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (type === 'WARNING') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    if (type === 'ALERT') return <Wrench className="h-5 w-5 text-primary" />;
    return <DollarSign className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 p-4 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-foreground">Notifications</h1>
            <p className="mt-1 text-xs text-muted-foreground">Dispatch, settlement, verification, and support updates for your account.</p>
            {lastUpdatedLabel ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Last updated {lastUpdatedLabel}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{unreadCount} unread</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? <button onClick={markAllRead} className="text-sm font-bold text-primary">Mark all read</button> : null}
              <button onClick={() => setFilterMode((current) => (current === 'ALL' ? 'UNREAD' : 'ALL'))} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground">
                <Filter className="h-3.5 w-3.5 text-primary" />
                {filterMode === 'ALL' ? 'Unread only' : 'Show all'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto p-4 pb-24">
        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total updates" value={<span className="text-2xl font-black">{notifications.length}</span>} />
          <MetricCard label="Unread" tone="primary" value={<span className="text-2xl font-black">{unreadCount}</span>} />
          <MetricCard label="Focus" value="Incoming jobs, payout, verification, support" />
        </section>

        {connectionLost ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Realtime updates were interrupted. This page is retrying with direct refresh.
          </div>
        ) : null}

        {loading ? (
          <LoadingScreen className="min-h-[240px]" />
        ) : filteredNotifications.length === 0 ? (
          <EmptyStateCard
            icon={Bell}
            title={filterMode === 'UNREAD' ? 'No unread partner alerts' : 'No partner alerts yet'}
            description={filterMode === 'UNREAD' ? 'Everything is already reviewed.' : 'Dispatch, settlement, and support updates will appear here.'}
          />
        ) : (
          filteredNotifications.map((notification) => (
            <motion.button
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => markRead(notification.id)}
              className={`flex w-full items-start gap-4 rounded-[1.5rem] border p-4 text-left shadow-sm transition-all hover:shadow-md ${
                notification.read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'
              }`}
            >
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                {iconForType(notification.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">{notification.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                  {!notification.read ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold uppercase text-primary">{notification.source}</span>
                  <span className="shrink-0 text-muted-foreground">{new Date(notification.time).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </main>
    </div>
  );
}
