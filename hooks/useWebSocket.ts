import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { RealtimeNotification } from "@/lib/order-notifications";

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

export interface UseWebSocketReturn {
  stompClient: Client | null;
  isConnected: boolean;
  sendMessage: (destination: string, body: unknown) => void;
}

type WebSocketNotificationHandlers = {
  onNotification?: (notification: RealtimeNotification) => void;
  onAdminOrder?: (notification: RealtimeNotification) => void;
};

function parseNotification(body: string): RealtimeNotification | null {
  try {
    const parsed = JSON.parse(body) as RealtimeNotification;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.error("Không thể đọc thông báo WebSocket:", error);
    return null;
  }
}

export const useWebSocket = (
  token: string,
  userId: string,
  handlers: WebSocketNotificationHandlers = {},
): UseWebSocketReturn => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      webSocketFactory: () => new SockJS(`${SOCKET_URL}/ws-sockjs`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);

        if (userId) {
          client.subscribe(`/topic/notification.${userId}`, (message) => {
            const notification = parseNotification(message.body);
            if (notification) {
              handlersRef.current.onNotification?.(notification);
            }
          });
        }

        if (handlersRef.current.onAdminOrder) {
          client.subscribe("/topic/admin.orders", (message) => {
            const notification = parseNotification(message.body);
            if (notification) {
              handlersRef.current.onAdminOrder?.(notification);
            }
          });
        }

        client.subscribe("/user/queue/errors", (message) => {
          console.error("Lỗi từ WebSocket server:", message.body);
        });
      },
      onStompError: (frame) => {
        console.error("Lỗi STOMP Broker:", frame.headers.message, frame.body);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      void client.deactivate();
      setStompClient(null);
      setIsConnected(false);
    };
  }, [token, userId]);

  const sendMessage = useCallback(
    (destination: string, body: unknown) => {
      if (!stompClient?.connected) {
        console.warn("WebSocket chưa kết nối, không thể gửi tin nhắn.");
        return;
      }

      stompClient.publish({
        destination,
        body: JSON.stringify(body),
      });
    },
    [stompClient],
  );

  return { stompClient, isConnected, sendMessage };
};
