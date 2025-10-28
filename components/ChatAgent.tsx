import React, { useState, useRef, useEffect } from 'react';
import { useGemini } from '../hooks/useGemini';
import { ChatIcon, PaperclipIcon } from './icons/Icons';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]); // return only base64 part
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


const ChatAgent: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { history, sendMessage, isLoading, isEnabled } = useGemini();
    const [input, setInput] = useState('');
    const [image, setImage] = useState<string | undefined>(undefined);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const agentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (agentRef.current && !agentRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleSend = async () => {
        if (input.trim() || image) {
            await sendMessage(input, image);
            setInput('');
            setImage(undefined);
            setImagePreview(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSend();
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const dataUrl = await fileToDataUrl(file);
            setImage(dataUrl);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    if (!isEnabled) return null;

    return (
        <div className="relative" ref={agentRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Open AI Agent Chat"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <ChatIcon className="w-6 h-6 text-gray-600" />
            </button>

            {isOpen && (
                 <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:translate-x-0 sm:mt-2 sm:w-96 origin-center sm:origin-top-right bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col z-40" style={{ height: '70vh', maxHeight: '550px' }}>
                    <div className="flex items-center justify-center p-4 bg-primary-navy text-white rounded-t-xl">
                        <h3 className="text-lg font-bold">AI Assistant</h3>
                    </div>

                    <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
                        {history.map((chat, index) => (
                            <div key={index} className={`flex items-start gap-3 ${chat.sender === 'user' ? 'justify-end' : ''}`}>
                                {chat.sender === 'model' && <div className="w-8 h-8 rounded-full bg-blue-200 flex-shrink-0"></div>}
                                <div className={`p-3 rounded-lg max-w-xs ${chat.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                                    {chat.image && <img src={`data:image/jpeg;base64,${chat.image}`} alt="User upload" className="rounded-md mb-2 max-w-full h-auto" />}
                                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: chat.message.replace(/\n/g, '<br />') }} />
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-200 flex-shrink-0"></div>
                                <div className="p-3 rounded-lg bg-white border">
                                    <div className="flex items-center space-x-1">
                                        <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200">
                        {imagePreview && (
                             <div className="relative w-24 h-24 mb-2">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                                <button
                                    onClick={() => {
                                        setImage(undefined);
                                        setImagePreview(null);
                                        if(fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                        <div className="relative flex items-center">
                             <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-500 hover:text-blue-600"
                                aria-label="Attach image"
                            >
                                <PaperclipIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything..."
                                className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-300"
                                disabled={isLoading}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatAgent;