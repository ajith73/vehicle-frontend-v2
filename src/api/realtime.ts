import { io, type Socket } from 'socket.io-client';
import { API_URL } from './apiClient';

type StreamHandlers<T> = {
  event: string;
  onMessage: (payload: T) => void;
  onOpen?: () => void;
  onError?: () => void;
};

type SubscribeAck = {
  ok: boolean;
  error?: string;
};

let socket: Socket | null = null;

const getSocketBaseUrl = () => {
  const apiUrl = new URL(API_URL);
  return `${apiUrl.protocol}//${apiUrl.host}`;
};

const ensureSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Login required to open live updates');
  }

  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false,
      auth: { token }
    });
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const openRealtimeStream = <T>(endpoint: string, handlers: StreamHandlers<T>) => {
  const client = ensureSocket();

  const subscribe = () => {
    client.emit('realtime:subscribe', { endpoint }, (response: SubscribeAck) => {
      if (!response?.ok) {
        handlers.onError?.();
      } else {
        handlers.onOpen?.();
      }
    });
  };

  const handleConnect = () => {
    subscribe();
  };

  const handleMessage = (payload: T) => {
    handlers.onMessage(payload);
  };

  const handleConnectError = () => {
    handlers.onError?.();
  };

  client.on('connect', handleConnect);
  client.on(handlers.event, handleMessage);
  client.on('connect_error', handleConnectError);

  if (client.connected) {
    subscribe();
  }

  return () => {
    client.off('connect', handleConnect);
    client.off(handlers.event, handleMessage);
    client.off('connect_error', handleConnectError);
  };
};
