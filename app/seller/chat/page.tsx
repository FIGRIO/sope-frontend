"use client";
import React, { useState, useEffect, useRef } from "react";
// Đảm bảo bạn đã lưu hook này ở thư mục tương ứng
import { useWebSocket } from "@/hooks/useWebSocket"; 

export default function SellerChatDashboard() {
    const [activeTab, setActiveTab] = useState("all");
    
    // --- STATE QUẢN LÝ CHAT ---
    const [messages, setMessages] = useState([
        // Dữ liệu mồi (Mock data) ban đầu
        { id: 1, text: "Shop ơi cho mình hỏi điện thoại này còn màu Đen không ạ?", sender: "buyer", time: "10:05 AM" },
        { id: 2, text: "Chào bạn, sản phẩm này bên mình vẫn còn sẵn màu Đen nguyên seal nhé ạ. Mình lên đơn cho bạn nha?", sender: "seller", time: "10:08 AM" }
    ]);
    const [inputMessage, setInputMessage] = useState("");
    
    // Khởi tạo ref để tự động cuộn xuống tin nhắn mới nhất
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- MOCK DATA (Trong thực tế sẽ lấy từ Redux/Context/Zustand hoặc LocalStorage) ---
    const token = "YOUR_JWT_TOKEN"; // Token của Seller
    const sellerId = "456";         // ID của tài khoản Seller đang đăng nhập
    const currentBuyerId = "123";   // ID của khách hàng đang được chọn (Nguyễn Văn A)
    const roomId = `buyer_${currentBuyerId}_seller_${sellerId}`; // Khớp với kiến trúc Backend

    // --- TÍCH HỢP WEBSOCKET ---
    const { stompClient, isConnected, sendMessage } = useWebSocket(token, sellerId);

    // Lắng nghe tin nhắn từ phòng chat hiện tại
    useEffect(() => {
        if (isConnected && stompClient) {
            const topic = `/topic/chat.${roomId}`;
            
            const subscription = stompClient.subscribe(topic, (messageFrame) => {
                const incomingMessage = JSON.parse(messageFrame.body);
                
                // Cập nhật state tin nhắn
                setMessages((prevMessages) => [
                    ...prevMessages, 
                    {
                        id: Date.now(), // Hoặc lấy ID từ backend trả về
                        text: incomingMessage.content,
                        sender: incomingMessage.senderId === sellerId ? "seller" : "buyer",
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [isConnected, stompClient, roomId, sellerId]);

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Hàm xử lý gửi tin nhắn
    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!inputMessage.trim() || !isConnected) return;

        const chatPayload = {
            roomId: roomId,
            senderId: sellerId,
            content: inputMessage.trim(),
            timestamp: new Date().toISOString()
        };

        // Gửi lên backend qua prefix /app (khớp cấu hình Spring Boot)
        sendMessage('/app/chat.send', chatPayload);
        
        // Reset ô nhập
        setInputMessage("");
    };

    return (
        <div className="flex h-screen w-full bg-[#F4F6F8] font-sans text-gray-800">

            <aside className="z-10 flex w-80 flex-col border-r border-gray-200 bg-white shadow-sm">
                {/* Header Cột Trái */}
                <div className="flex h-[70px] items-center bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] px-5 shadow-sm">
                    <h1 className="text-lg font-bold tracking-wide text-white">SOPE CHAT</h1>
                </div>

                {/* Khung tìm kiếm & Tabs (Giữ nguyên giao diện của bạn) */}
                <div className="border-b border-gray-100 p-4">
                    {/* ... (Đã ẩn bớt để tiết kiệm không gian, bạn giữ nguyên code cũ) ... */}
                    <div className="flex gap-4 text-sm font-medium">
                        <button onClick={() => setActiveTab("all")} className={`pb-2 transition-colors ${activeTab === "all" ? "border-b-2 border-[#EE4D2D] text-[#EE4D2D]" : "text-gray-500 hover:text-gray-700"}`}>
                            Tất cả
                        </button>
                        <button onClick={() => setActiveTab("unread")} className={`flex items-center gap-1 pb-2 transition-colors ${activeTab === "unread" ? "border-b-2 border-[#EE4D2D] text-[#EE4D2D]" : "text-gray-500 hover:text-gray-700"}`}>
                            Chưa đọc <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">2</span>
                        </button>
                    </div>
                </div>

                {/* Danh sách Chat tĩnh */}
                <div className="flex-1 overflow-y-auto">
                    {/* Item đang chọn (Active) */}
                    <div className="flex cursor-pointer border-l-4 border-[#EE4D2D] bg-orange-50/50 p-4 transition hover:bg-orange-50">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-300">
                            <img src="https://i.pravatar.cc/150?img=32" alt="Avatar" className="h-full w-full object-cover" />
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                        </div>
                        <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <h3 className="truncate font-bold text-gray-800">Nguyễn Văn A</h3>
                                <span className="text-[11px] font-medium text-[#EE4D2D]">Đang mở</span>
                            </div>
                            <p className="truncate text-sm font-medium text-gray-600">Đang trò chuyện...</p>
                        </div>
                    </div>
                </div>
            </aside>

            <section className="flex flex-1 flex-col bg-[#F9FAFB]">
                {/* Header khung chat */}
                <div className="z-0 flex h-[70px] items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-800">Nguyễn Văn A</h2>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Khách hàng mới</span>
                        {/* Trạng thái kết nối WebSocket */}
                        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} title={isConnected ? "Đã kết nối" : "Mất kết nối"}></span>
                    </div>
                </div>

                {/* Vùng hiển thị tin nhắn (RENDER ĐỘNG TỪ STATE) */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    <div className="flex justify-center">
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-[11px] font-medium text-gray-500">Hôm nay</span>
                    </div>

                    {messages.map((msg, index) => (
                        msg.sender === "buyer" ? (
                            /* Tin nhắn khách hàng (Trái) */
                            <div key={index} className="flex items-end gap-2">
                                <img src="https://i.pravatar.cc/150?img=32" alt="Avatar" className="mb-5 h-8 w-8 rounded-full" />
                                <div className="flex max-w-[70%] flex-col gap-1">
                                    <div className="rounded-2xl rounded-bl-none border border-gray-100 bg-white p-3 text-sm text-gray-700 shadow-sm">
                                        {msg.text}
                                    </div>
                                    <span className="ml-1 text-[11px] text-gray-400">{msg.time}</span>
                                </div>
                            </div>
                        ) : (
                            /* Tin nhắn Shop (Phải) */
                            <div key={index} className="flex items-end justify-end gap-2">
                                <div className="flex max-w-[70%] flex-col items-end gap-1">
                                    <div className="rounded-2xl rounded-br-none bg-[#EE4D2D] p-3 text-sm text-white shadow-sm">
                                        {msg.text}
                                    </div>
                                    <div className="mr-1 flex items-center gap-1">
                                        <span className="text-[11px] text-gray-400">{msg.time}</span>
                                        <span className="text-[11px] font-bold text-blue-500">· Đã gửi</span>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                    {/* Div neo để tự động cuộn xuống cuối */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Khung nhập text */}
                <div className="border-t border-gray-200 bg-white p-4">
                    {/* Quick Replies (Giữ nguyên) */}
                    <div className="scrollbar-hide mb-3 flex gap-2 overflow-x-auto pb-1">
                        <button onClick={() => setInputMessage("Còn hàng không?")} className="whitespace-nowrap rounded-full border border-[#EE4D2D]/30 bg-orange-50 px-3 py-1.5 text-[12px] font-medium text-[#EE4D2D] transition hover:bg-[#EE4D2D] hover:text-white">
                            Còn hàng không?
                        </button>
                    </div>

                    {/* Ô nhập chat (Đã liên kết State và Event) */}
                    <form onSubmit={handleSendMessage} className="flex items-center rounded-xl border border-gray-300 bg-gray-50 px-2 transition-colors focus-within:border-[#EE4D2D] focus-within:bg-white">
                        <input 
                            type="text" 
                            placeholder="Nhập tin nhắn..." 
                            className="max-h-32 min-h-[44px] w-full bg-transparent px-3 text-sm outline-none"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                        />
                        <button 
                            type="submit"
                            disabled={!inputMessage.trim() || !isConnected}
                            className={`m-1 flex h-9 w-9 items-center justify-center rounded-lg transition ${inputMessage.trim() && isConnected ? 'bg-[#EE4D2D] hover:bg-orange-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10l15-7-4 14-3.5-4L7 16v-3.5L2 10z" /></svg>
                        </button>
                    </form>
                </div>
            </section>

            {/* Sidebar Phải (Thông tin bổ sung - Giữ nguyên) */}
            <aside className="z-10 hidden w-80 flex-col border-l border-gray-200 bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)] lg:flex">
               {/* Code cột phải của bạn ở đây... */}
               <div className="flex h-[70px] items-center border-b border-gray-100 px-5">
                    <h2 className="text-base font-bold text-gray-800">Thông tin bổ sung</h2>
                </div>
            </aside>

        </div>
    );
}