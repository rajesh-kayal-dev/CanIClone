'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getIdeasWebSocketUrl,
  type GeneratedActionPayload,
  type IdeasCapabilities,
  type InitialAnalysisPayload,
  type InitialAnalysisStage,
  type ResearchActionPayload,
} from '@/lib/api/ideas';

export type IdeasSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type IdeasSocketClientMessage =
  | { type: 'ping' }
  | {
      type: 'chat' | 'analyze' | 'research' | 'prompt' | 'mvp';
      requestId: string;
      ideaId: string;
      anonymousUserId: string;
      content?: string;
      retry?: boolean;
    };

export type IdeasSocketEvent =
  | { type: 'ready'; capabilities: IdeasCapabilities }
  | { type: 'pong' }
  | { type: 'chat.start'; requestId?: string; ideaId: string }
  | { type: 'chat.progress'; requestId?: string; ideaId: string; message: string }
  | { type: 'chat.delta'; requestId?: string; ideaId: string; token: string }
  | {
      type: 'chat.done';
      requestId?: string;
      ideaId: string;
      userMessageId: string;
      assistantMessageId: string;
      content: string;
    }
  | { type: 'analysis.start'; requestId?: string; ideaId: string }
  | {
      type: 'analysis.progress';
      requestId?: string;
      ideaId: string;
      stage: InitialAnalysisStage;
      message: string;
    }
  | { type: 'analysis.title'; requestId?: string; ideaId: string; title: string }
  | { type: 'analysis.delta'; requestId?: string; ideaId: string; token: string }
  | {
      type: 'analysis.done';
      requestId?: string;
      ideaId: string;
      payload: InitialAnalysisPayload;
    }
  | {
      type: 'action.start';
      requestId?: string;
      action: 'research' | 'prompt' | 'mvp';
      ideaId: string;
    }
  | {
      type: 'action.progress';
      requestId?: string;
      action: 'research' | 'prompt' | 'mvp';
      ideaId: string;
      message: string;
    }
  | {
      type: 'action.done';
      requestId?: string;
      action: 'research' | 'prompt' | 'mvp';
      ideaId: string;
      payload: ResearchActionPayload | GeneratedActionPayload;
    }
  | {
      type: 'error';
      requestId?: string;
      code: string;
      message: string;
    };

interface UseIdeasSocketOptions {
  anonymousUserId: string | null;
  onEvent: (event: IdeasSocketEvent) => void;
}

function isSocketEvent(value: unknown): value is IdeasSocketEvent {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === 'string';
}

export function useIdeasSocket({ anonymousUserId, onEvent }: UseIdeasSocketOptions) {
  const [status, setStatus] = useState<IdeasSocketStatus>('disconnected');
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
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
      }

      setStatus('connecting');
      try {
        socket = new WebSocket(getIdeasWebSocketUrl());
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
          // Ignore malformed server frames; the next valid frame can still be used.
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
  }, [anonymousUserId, reconnectNonce]);

  const send = useCallback((message: IdeasSocketClientMessage): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const reconnect = useCallback(() => {
    setReconnectNonce((value) => value + 1);
  }, []);

  return { status, send, reconnect };
}
