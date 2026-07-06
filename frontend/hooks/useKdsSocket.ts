'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const KDS_WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/api$/, '');

export function useKdsSocket(
  vendorId: string | null,
  {
    onNewOrder,
    onOrderUpdate,
  }: {
    onNewOrder?: (order: unknown) => void;
    onOrderUpdate?: (update: unknown) => void;
  },
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!vendorId) return;

    const socket = io(`${KDS_WS_URL}/kds`, {
      query: { vendor_id: vendorId },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    if (onNewOrder) socket.on('new_order', onNewOrder);
    if (onOrderUpdate) socket.on('order_update', onOrderUpdate);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  return socketRef;
}
