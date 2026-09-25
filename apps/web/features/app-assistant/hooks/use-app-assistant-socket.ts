'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getAppAIWebSocketUrl,
  type AppAIAction,
  type AppAICapabilities,
  type AppAIActionPayloadMap,
} from '@/lib/api/app-assistant';

export type AppAISocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type AppAISocketClientMessage =
  | { type: 'ping' }
  | {
      type: 'app.chat' | 'app.research' | 'app.prompt' | 'app.mvp';
      requestId: string;
      appSlug: string;
      anonymousUserId: string;
      content?: string;
      retry?: boolean;
    }
  | {
      type: 'app.cancel';
      requestId: string;
      appSlug: string;
      anonymousUserId: string;
    };

type AppAIActionDone = {
  [K in AppAIAction]: {
    type: 'app.action.done';
    requestId?: string;
    appSlug: string;
    action: K;
    payload: AppAIActionPayloadMap[K];
  };
}[AppAIAction];

export type AppAISocketEvent =
  | { type: 'ready'; capabilities: AppAICapabilities }
  | { type: 'pong' }
  | { type: 'app.chat.start'; requestId?: string; appSlug: string }
  | { type: 'app.chat.progress'; requestId?: string; appSlug: string; message: string }
  | { type: 'app.chat.delta'; requestId?: string; appSlug: string; token: string }
  | {
      type: 'app.chat.done';
      requestId?: string;
      appSlug: string;
      userMessageId: string;
      assistantMessageId: string;
      content: string;
    }
  | {
      type: 'app.cancelled';
      requestId?: string;
      appSlug: string;
      kind: 'chat' | AppAIAction;
    }
  | {
      type: 'app.action.start';
      requestId?: string;
      appSlug: string;
      action: AppAIAction;
    }
  | {
      type: 'app.action.progress';
      requestId?: string;
      appSlug: string;
      action: AppAIAction;
      message: string;
    }
  | AppAIActionDone
  | { type: 'error'; requestId?: string; code: string; message: string };

interface UseAppAISocketOptions {
  appSlug: string;
  anonymousUserId: string | null;
  onEvent: (event: AppAISocketEvent) => void;
}

function isSocketEvent(value: unknown): value is AppAISocketEvent {
  return Boolean(value && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string');
}

export function useAppAISocket({ appSlug, anonymousUserId, onEvent }: UseAppAISocketOptions) {
  const [status, setStatus] = useState<AppAISocketStatus>('disconnected');
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const eventHandlerRef = useRef(onEvent);

  useEffect(() => {
    eventHandlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!anonymousUserId) {
      socketRef.current = null;
      return;
    }

    let disposed = false;
    let retryTimer: number | undefined;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (disposed) return;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
      setStatus('connecting');
      try {
        socket = new WebSocket(getAppAIWebSocketUrl());
        socketRef.current = socket;
      } catch {
        setStatus('error');
        retryTimer = window.setTimeout(connect, 2000);
        return;
      }

      socket.onopen = () => {
        if (!disposed) setStatus('connected');
      };
      socket.onmessage = (message) => {
        if (disposed) return;
        try {
          const parsed: unknown = JSON.parse(String(message.data));
          if (isSocketEvent(parsed)) eventHandlerRef.current(parsed);
        } catch {
          // Ignore malformed frames; the next valid frame remains usable.
        }
      };
      socket.onerror = () => {
        if (!disposed) setStatus('error');
      };
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (disposed) return;
        setStatus('disconnected');
        retryTimer = window.setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [anonymousUserId, appSlug, reconnectNonce]);

  const send = useCallback((message: AppAISocketClientMessage): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const reconnect = useCallback(() => setReconnectNonce((value) => value + 1), []);

  return { status, send, reconnect };
}
