import { useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Định nghĩa kiểu dữ liệu trả về của Hook giúp IDE gợi ý code tốt hơn
export interface UseWebSocketReturn {
  stompClient: Client | null;
  isConnected: boolean;
  sendMessage: (destination: string, body: any) => void;
}

export const useWebSocket = (token: string, userId: string): UseWebSocketReturn => {
  // Định nghĩa rõ ràng state này là Client hoặc null
  const [stompClient, setStompClient] = useState<Client | null>(null);
  // Định nghĩa state này là boolean
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      brokerURL: `${SOCKET_URL.replace('http', 'ws')}/ws`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      webSocketFactory: () => new SockJS(`${SOCKET_URL}/ws-sockjs`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('Đã kết nối WebSocket thành công');
        setIsConnected(true);

        if (userId) {
          client.subscribe(`/topic/notification.${userId}`, (message) => {
            const notificationData = JSON.parse(message.body);
            console.log('Có thông báo mới:', notificationData);
          });
          
          client.subscribe('/user/queue/errors', (message) => {
             console.error('Lỗi từ server:', message.body);
          });
        }
      },

      onStompError: (frame) => {
        console.error('Lỗi STOMP Broker: ' + frame.headers['message']);
        console.error('Chi tiết: ' + frame.body);
      },
      
      onWebSocketClose: () => {
        setIsConnected(false);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [token, userId]);

  // Thêm type string cho destination và any (hoặc type cụ thể) cho body
  const sendMessage = useCallback((destination: string, body: any) => {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: destination,
        body: JSON.stringify(body),
      });
    } else {
      console.warn('WebSocket chưa kết nối, không thể gửi tin nhắn.');
    }
  }, [stompClient]);

  return { stompClient, isConnected, sendMessage };
};