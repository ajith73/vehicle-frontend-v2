import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';

type CustomerNotification = {
  id: string;
  type: 'ALERT' | 'SUCCESS' | 'WARNING' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await apiClient<CustomerNotification[]>('/customer/notifications');
        setNotifications(data || []);
      } catch (error) {
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const markAllRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'ALERT': return <Navigation className="w-5 h-5 text-blue-500" />;
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getBg = (read: boolean) => {
    if (!read) return 'bg-primary/5 border-l-4 border-l-primary';
    return 'bg-card border-border';
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-bold text-primary hover:underline">Mark all read</button>
        )}
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">No Notifications</h3>
            <p className="text-muted-foreground text-sm mt-2">You're all caught up.</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => markRead(notification.id)}
                className={`border p-4 rounded-2xl flex items-start gap-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${getBg(notification.read)}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  notification.type === 'ALERT' ? 'bg-blue-500/10' :
                  notification.type === 'SUCCESS' ? 'bg-emerald-500/10' :
                  notification.type === 'WARNING' ? 'bg-amber-500/10' :
                  'bg-primary/10'
                }`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className={`font-bold ${!notification.read ? 'text-foreground' : 'text-foreground/80'}`}>{notification.title}</h3>
                    {!notification.read && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notification.message}</p>
                  <p className={`text-xs font-bold mt-2 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`}>
                    {new Date(notification.time).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
