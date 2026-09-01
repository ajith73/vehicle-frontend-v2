import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AUTH_STATE_CHANGED_EVENT } from '../../api/apiClient';
import { openRealtimeStream } from '../../api/realtime';
import {
  registerRoadresqServiceWorker,
  requestBrowserNotificationPermission,
  showBrowserNotification
} from '../../lib/browserNotifications';

type BasicNotification = {
  id: string;
  title: string;
  message: string;
  time?: string;
};

type AdminLiveRequest = {
  id: number;
  status?: string;
  issueSummary?: string;
  ServiceType?: { name?: string };
};

const parseStoredAuth = () => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '',
  role: typeof window !== 'undefined' ? localStorage.getItem('role') || '' : ''
});

export default function RealtimeNotificationBridge() {
  const location = useLocation();
  const customerInitialized = useRef(false);
  const mechanicInitialized = useRef(false);
  const adminInitialized = useRef(false);
  const customerSeen = useRef<Set<string>>(new Set());
  const mechanicSeen = useRef<Set<string>>(new Set());
  const adminSeen = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    registerRoadresqServiceWorker();
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const { role, token } = parseStoredAuth();
      if (role && token) {
        requestBrowserNotificationPermission(role.toLowerCase());
      }
    };

    handleAuthChange();
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange as EventListener);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const { token, role } = parseStoredAuth();
    if (!token || !role) {
      customerInitialized.current = false;
      mechanicInitialized.current = false;
      adminInitialized.current = false;
      customerSeen.current.clear();
      mechanicSeen.current.clear();
      adminSeen.current.clear();
      return;
    }

    const cleanup: Array<() => void> = [];

    const handleCustomerNotifications = (items: BasicNotification[]) => {
      const nextItems = Array.isArray(items) ? items : [];
      if (!customerInitialized.current) {
        customerInitialized.current = true;
        customerSeen.current = new Set(nextItems.map((item) => String(item.id)));
        return;
      }

      nextItems.forEach((item) => {
        const notificationId = String(item.id);
        if (customerSeen.current.has(notificationId)) {
          return;
        }

        customerSeen.current.add(notificationId);
        void showBrowserNotification({
          title: item.title || 'RoadResQ update',
          body: item.message || 'You have a new customer update.',
          url: '/customer/notifications',
          tag: `customer-${notificationId}`
        });
      });
    };

    const handleMechanicNotifications = (items: BasicNotification[]) => {
      const nextItems = Array.isArray(items) ? items : [];
      if (!mechanicInitialized.current) {
        mechanicInitialized.current = true;
        mechanicSeen.current = new Set(nextItems.map((item) => String(item.id)));
        return;
      }

      nextItems.forEach((item) => {
        const notificationId = String(item.id);
        if (mechanicSeen.current.has(notificationId)) {
          return;
        }

        mechanicSeen.current.add(notificationId);
        void showBrowserNotification({
          title: item.title || 'Partner update',
          body: item.message || 'You have a new partner notification.',
          url: '/partner/notifications',
          tag: `mechanic-${notificationId}`
        });
      });
    };

    const handleAdminLiveRequests = (items: AdminLiveRequest[]) => {
      const nextItems = Array.isArray(items) ? items : [];
      if (!adminInitialized.current) {
        adminInitialized.current = true;
        adminSeen.current = new Map(
          nextItems.map((item) => [Number(item.id), String(item.status || '')])
        );
        return;
      }

      nextItems.forEach((item) => {
        const requestId = Number(item.id);
        const nextStatus = String(item.status || '');
        const previousStatus = adminSeen.current.get(requestId);
        adminSeen.current.set(requestId, nextStatus);

        if (!previousStatus) {
          void showBrowserNotification({
            title: 'New service request',
            body: `${item.ServiceType?.name || item.issueSummary || 'Roadside assistance'} • REQ-${requestId}`,
            url: '/admin/v2/live-ops',
            tag: `admin-request-${requestId}`
          });
          return;
        }

        if (previousStatus !== nextStatus) {
          void showBrowserNotification({
            title: `Request ${nextStatus.replace(/_/g, ' ')}`,
            body: `REQ-${requestId} moved from ${previousStatus.replace(/_/g, ' ')} to ${nextStatus.replace(/_/g, ' ')}.`,
            url: '/admin/v2/live-ops',
            tag: `admin-request-${requestId}-${nextStatus}`
          });
        }
      });
    };

    if (role === 'Customer') {
      cleanup.push(
        openRealtimeStream<BasicNotification[]>('/customer/notifications', {
          event: 'customer:notifications:update',
          onMessage: handleCustomerNotifications
        })
      );
    }

    if (role === 'Mechanic') {
      cleanup.push(
        openRealtimeStream<BasicNotification[]>('/mechanic/notifications', {
          event: 'mechanic:notifications:update',
          onMessage: handleMechanicNotifications
        })
      );
    }

    if (role === 'Admin' || role === 'Super Admin') {
      cleanup.push(
        openRealtimeStream<AdminLiveRequest[]>('/admin/live/requests', {
          event: 'admin:live-requests:update',
          onMessage: handleAdminLiveRequests
        })
      );
    }

    return () => {
      cleanup.forEach((close) => close());
    };
  }, [location.pathname]);

  return null;
}
