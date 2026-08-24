import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, DollarSign, Loader2, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

type PartnerNotification = {
  id: string;
  type: 'ALERT' | 'SUCCESS' | 'WARNING' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  read: boolean;
  source: string;
};

export default function PartnerNotificationsPage() {
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await apiClient<PartnerNotification[]>('/mechanic/notifications');
        setNotifications(data || []);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load partner notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const iconForType = (type: PartnerNotification['type']) => {
    if (type === 'SUCCESS') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (type === 'WARNING') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    if (type === 'ALERT') return <Wrench className="w-5 h-5 text-primary" />;
    return <DollarSign className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground">{unreadCount} unread updates</p>
        </div>
        {unreadCount > 0 ? (
          <button onClick={markAllRead} className="text-sm font-bold text-primary">
            Mark all read
          </button>
        ) : null}
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground">No partner alerts yet</h3>
            <p className="text-muted-foreground text-sm mt-2">Dispatch, settlement, and support updates will appear here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <motion.button
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => markRead(notification.id)}
              className={`text-left border p-4 rounded-2xl flex items-start gap-4 shadow-sm transition-all hover:shadow-md ${
                notification.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/30'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                {iconForType(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  </div>
                  {!notification.read ? <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" /> : null}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary uppercase">{notification.source}</span>
                  <span className="text-muted-foreground">{new Date(notification.time).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </main>
    </div>
  );
}
