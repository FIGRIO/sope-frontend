'use client';
import React, { useState, useRef, useEffect } from 'react';

// Định nghĩa cấu trúc dữ liệu cho một tin nhắn
interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Khởi tạo tin nhắn chào mừng mặc định
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'ai',
            text: 'Chào bạn! Mình là trợ lý ảo AI. Mình có thể giúp gì cho bạn về các sản phẩm điện thoại, tablet hay laptop của cửa hàng hôm nay?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Hàm gọi API xử lý tin nhắn
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 1. Thêm tin nhắn của User vào giao diện
        const userMsg: Message = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: trimmedInput,
            timestamp: currentTime
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            // 2. Gọi API đến FastAPI backend (main.py)
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: "khach_hang_test", // Khớp với model ChatRequest trong main.py
                    message: trimmedInput
                }),
            });

            if (!response.ok) {
                throw new Error('Lỗi kết nối đến server AI');
            }

            const data = await response.json();

            // 3. Hiển thị câu trả lời của AI
            const aiMsg: Message = {
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: data.reply || 'Xin lỗi, mình không nhận được phản hồi hợp lệ.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Lỗi khi gọi Chatbot API:", error);
            // Hiển thị thông báo lỗi nếu server sập hoặc không kết nối được
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                sender: 'ai',
                text: 'Hệ thống đang bận hoặc server FastAPI chưa được bật. Vui lòng thử lại sau!',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xử lý khi nhấn Enter trong ô input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    };
// Hàm biến cú pháp [Tên](/link) của AI thành thẻ <a> có thể click được
    const formatMessageWithLinks = (text: string) => {
        // Biểu thức chính quy tìm đoạn [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            // Push phần text bình thường phía trước link
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            // Push thẻ <a> (Link)
            parts.push(
                <a 
                    key={match.index} 
                    href={match[2]} 
                    target="_blank" // Mở link ở tab mới, có thể bỏ dòng này nếu muốn chuyển trang ở tab hiện tại
                    rel="noopener noreferrer" 
                    className="text-blue-700 font-bold underline hover:text-blue-900 transition-colors"
                >
                    {match[1]}
                </a>
            );
            lastIndex = match.index + match[0].length;
        }
        
        // Push phần text còn lại
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        
        return parts.length > 0 ? parts : text;
    };
    // UI khi widget đóng
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
        );
    }

    // UI khi widget mở
    return (
        <div className="fixed bottom-6 right-6 w-[380px] h-[640px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="h-[70px] bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#EE4D2D] font-bold">
                        AI
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base leading-tight">Trợ lý ảo AI</h3>
                        <p className="text-white/80 text-xs">Luôn sẵn sàng hỗ trợ 24/7</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="text-white hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            {/* Khung tin nhắn */}
            <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col gap-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-col items-end' : ''}`}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-[#EE4D2D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">AI</div>
                        )}
                        <div className={msg.sender === 'user' ? 'max-w-[80%]' : 'w-[fit-content] max-w-[85%]'}>
                            <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                                msg.sender === 'user' 
                                ? 'bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] text-white rounded-tr-sm' 
                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                            }`}>
                                {formatMessageWithLinks(msg.text)}
                            </div>
                            <div className={`text-xs text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                                {msg.timestamp}
                            </div>
                        </div>
                    </div>
                ))}
{/* Hiệu ứng Loading */}
                {isLoading && (
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#EE4D2D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">AI</div>
                        <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                
                {/* Điểm neo để auto-scroll */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Chat */}
            <div className="h-[70px] border-t border-gray-200 p-3 bg-white flex items-center gap-2 shrink-0">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    placeholder="Nhập tin nhắn của bạn..."
                    className="text-black flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2.5 text-sm focus:ring-0 focus:outline-none disabled:opacity-50"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] flex items-center justify-center text-white shrink-0 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}