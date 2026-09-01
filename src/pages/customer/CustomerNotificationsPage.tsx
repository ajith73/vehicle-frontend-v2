import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Filter, Navigation, RefreshCw, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';
import { openRealtimeStream } from '../../api/realtime';
import EmptyStateCard from '../../components/common/EmptyStateCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import MetricCard from '../../components/common/MetricCard';

const CUSTOMER_NOTIFICATION_READ_KEY = 'roadresq.customer.notification-read';

type CustomerNotification = {
  id: string;
  type: 'ALERT' | 'SUCCESS' | 'WARNING' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  read: boolean;
};

type FilterMode = 'ALL' | 'UNREAD';

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');

  const getStoredReadIds = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CUSTOMER_NOTIFICATION_READ_KEY) || '[]');
      return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const persistReadIds = (ids: Set<string>) => {
    localStorage.setItem(CUSTOMER_NOTIFICATION_READ_KEY, JSON.stringify(Array.from(ids)));
  };

  const applyReadState = (items: CustomerNotification[]) => {
    const storedReadIds = getStoredReadIds();
    return (items || []).map((notification) => ({
      ...notification,
      read: notification.read || storedReadIds.has(String(notification.id))
    }));
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiClient<CustomerNotification[]>('/customer/notifications');
      setNotifications(applyReadState(data || []));
      setConnectionLost(false);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error: any) {
      toast.error(error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();

    const closeStream = openRealtimeStream<CustomerNotification[]>('/customer/notifications', {
      event: 'customer:notifications:update',
      onMessage: (payload) => {
        setNotifications(applyReadState(Array.isArray(payload) ? payload : []));
        setLoading(false);
        setConnectionLost(false);
        setLastUpdatedAt(new Date().toISOString());
      },
      onError: async () => {
        setConnectionLost(true);
        try {
          const data = await apiClient<CustomerNotification[]>('/customer/notifications');
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

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);
  const filteredNotifications = useMemo(
    () => (filterMode === 'UNREAD' ? notifications.filter((notification) => !notification.read) : notifications),
    [filterMode, notifications]
  );
  const lastUpdatedLabel = useMemo(
    () => (lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('en-IN') : null),
    [lastUpdatedAt]
  );

  const markAllRead = () => {
    const ids = getStoredReadIds();
    notifications.forEach((notification) => ids.add(String(notification.id)));
    persistReadIds(ids);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const markRead = (id: string) => {
    const ids = getStoredReadIds();
    ids.add(String(id));
    persistReadIds(ids);
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return <Navigation className="h-5 w-5 text-blue-500" />;
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 p-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-foreground">Notifications</h1>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Request, arrival, payment, and support updates stay synced here.</p>
            {lastUpdatedLabel ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Last updated {lastUpdatedLabel}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-2">
            {unreadCount > 0 ? (
              <button onClick={markAllRead} className="text-sm font-bold text-primary hover:underline">
                Mark all read
              </button>
            ) : null}
            <button onClick={() => setFilterMode((current) => (current === 'ALL' ? 'UNREAD' : 'ALL'))} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground">
              <Filter className="h-3.5 w-3.5 text-primary" />
              {filterMode === 'ALL' ? 'Show unread' : 'Show all'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto p-4 pb-24">
        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total alerts" value={<span className="text-2xl font-black">{notifications.length}</span>} />
          <MetricCard label="Unread" tone="primary" value={<span className="text-2xl font-black">{unreadCount}</span>} />
          <MetricCard label="Focus" value="Assignment, ETA, service, payment" />
        </section>

        {connectionLost ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Realtime connection was interrupted. The page is retrying with a direct refresh.
          </div>
        ) : null}

        {loading ? (
          <LoadingScreen className="min-h-[240px]" />
        ) : filteredNotifications.length === 0 ? (
          <EmptyStateCard
            icon={filterMode === 'UNREAD' ? ShieldAlert : Bell}
            title={filterMode === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            description={filterMode === 'UNREAD' ? 'You are all caught up right now.' : 'Updates will appear here when your request or support status changes.'}
          />
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification) => (
              <motion.button
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onClick={() => markRead(notification.id)}
                className={`flex w-full items-start gap-4 rounded-[1.5rem] border p-4 text-left shadow-sm transition-all hover:shadow-md ${
                  notification.read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'
                }`}
              >
                <div className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  notification.type === 'ALERT' ? 'bg-blue-500/10' :
                  notification.type === 'SUCCESS' ? 'bg-emerald-500/10' :
                  notification.type === 'WARNING' ? 'bg-amber-500/10' :
                  'bg-primary/10'
                }`}>
                  {getIcon(notification.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={`text-sm font-bold ${notification.read ? 'text-foreground/85' : 'text-foreground'}`}>{notification.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notification.message}</p>
                    </div>
                    {!notification.read ? <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                  </div>
                  <p className={`mt-3 text-xs font-bold ${notification.read ? 'text-muted-foreground' : 'text-primary'}`}>
                    {new Date(notification.time).toLocaleString('en-IN')}
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
