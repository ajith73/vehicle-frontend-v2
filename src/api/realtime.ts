import { API_URL } from './apiClient';

type StreamHandlers<T> = {
  event: string;
  onMessage: (payload: T) => void;
  onOpen?: () => void;
  onError?: () => void;
};

const buildStreamUrl = (endpoint: string) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Login required to open live updates');
  }

  const url = new URL(`${API_URL}${endpoint}`);
  url.searchParams.set('token', token);
  return url.toString();
};

export const openRealtimeStream = <T>(endpoint: string, handlers: StreamHandlers<T>) => {
  const source = new EventSource(buildStreamUrl(endpoint));

  source.addEventListener(handlers.event, (event) => {
    try {
      handlers.onMessage(JSON.parse((event as MessageEvent).data) as T);
    } catch {
      handlers.onError?.();
    }
  });

  source.onopen = () => {
    handlers.onOpen?.();
  };

  source.onerror = () => {
    handlers.onError?.();
  };

  return () => {
    source.close();
  };
};
