"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMessages, sendMessage, deleteChatHistory } from "@/lib/actions/chat";
import { cn } from "@/lib/utils";
import {
    Send, Search, User, MoreVertical, Phone, Video,
    Image as ImageIcon, Smile, CheckCheck, Paperclip, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { LinkPreview } from "@/components/chat/LinkPreview";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";

// ... (existing imports)

// Logic to render text with Link Preview
const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);

    return (
        <div className="flex flex-col">
            <p className="leading-relaxed whitespace-pre-wrap break-words">{content}</p>
            {urls?.map((url, i) => (
                <LinkPreview key={i} url={url} />
            ))}
        </div>
    );
};

// ... inside component ...



interface Contact {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
    file_url?: string;
    file_type?: string;
}

interface ChatInterfaceProps {
    initialContacts: Contact[];
    currentUserId: string;
    currentUserRole: string;
}

export function ChatInterface({ initialContacts, currentUserId, currentUserRole }: ChatInterfaceProps) {
    const [contacts] = useState(initialContacts);
    const [activeContact, setActiveContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [stateDeleteConfirm, setStateDeleteConfirm] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Check permissions
    const canDeleteChat = currentUserRole === "superadmin" || currentUserRole === "teacher";

    const filteredContacts = contacts.filter((c) =>
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 1. Fetch Messages when Active Contact changes
    useEffect(() => {
        if (activeContact) {
            setIsLoadingMessages(true);
            getMessages(activeContact.id).then((msgs) => {
                setMessages(msgs || []);
                setIsLoadingMessages(false);
                scrollToBottom();
            });
            setShowMenu(false); // Close menu when changing contact
        }
    }, [activeContact]);

    // 2. Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel("chat-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `receiver_id=eq.${currentUserId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (activeContact && newMsg.sender_id === activeContact.id) {
                        setMessages((prev) => [...prev, newMsg]);
                        scrollToBottom();
                    } else {
                        const sender = contacts.find(c => c.id === newMsg.sender_id);
                        toast.info(`New message from ${sender?.full_name}`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeContact, currentUserId, contacts, supabase]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact) return;

        const content = newMessage;
        const tempId = Math.random().toString(36).substring(7);

        // Optimistic Update
        const optimisticMsg: Message = {
            id: tempId,
            sender_id: currentUserId,
            receiver_id: activeContact.id,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false,
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setNewMessage("");
        scrollToBottom();

        // Server Action
        const res = await sendMessage(content, activeContact.id);
        if (res.error) {
            toast.error("Failed to send message");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeContact) return;

        setIsUploading(true);
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, file);

        if (error) {
            toast.error("Upload failed");
            setIsUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(data.path);

        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';

        // Optimistic Update for File
        const tempId = Math.random().toString(36).substring(7);
        const optimisticMsg: Message = {
            id: tempId,
            sender_id: currentUserId,
            receiver_id: activeContact.id,
            content: "",
            file_url: publicUrl,
            file_type: type,
            created_at: new Date().toISOString(),
            is_read: false,
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        scrollToBottom();

        await sendMessage("", activeContact.id, publicUrl, type);
        setIsUploading(false);
    };

    const handleDeleteChat = async () => {
        if (!activeContact) return;

        setIsDeleting(true);
        const res = await deleteChatHistory(activeContact.id);
        setIsDeleting(false);
        setStateDeleteConfirm(false); // Close modal

        if (res.success || !res.error) {
            setMessages([]);
            toast.success("Chat history cleared");
        } else {
            toast.error(res.error || "Failed to delete chat");
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-4 min-h-0 bg-transparent">

            {/* LEFT PANE: Contact List - Clean Style */}
            <div className="w-full md:w-[320px] bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col min-h-0 hidden md:flex overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-white">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredContacts.map((contact) => {
                        const isActive = activeContact?.id === contact.id;
                        return (
                            <button
                                key={contact.id}
                                onClick={() => setActiveContact(contact)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                                    isActive ? "bg-indigo-50" : "hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden border transition-colors",
                                    isActive ? "border-indigo-200 bg-white shadow-sm" : "border-slate-100 bg-slate-100"
                                )}>
                                    {contact.avatar_url ? (
                                        <img src={contact.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-5 w-5 text-slate-400" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className={cn("text-sm font-semibold truncate", isActive ? "text-indigo-600" : "text-slate-900")}>
                                            {contact.full_name}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-medium">12:30</span>
                                    </div>
                                    <p className="text-xs text-slate-500 capitalize truncate">{contact.role}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT PANE: Chat Window - Clean Style */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col min-h-0 overflow-hidden relative">
                {!activeContact ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
                            <Send className="h-8 w-8 text-indigo-500/30" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Select a Chat</h3>
                        <p className="text-sm mt-1">Choose a contact to start conversation</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="h-16 px-6 border-b border-slate-100 bg-white flex items-center justify-between relative z-20">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                                    {activeContact.avatar_url ? (
                                        <img src={activeContact.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : <User className="h-5 w-5 text-slate-400" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">{activeContact.full_name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                                    <Phone className="h-4 w-4" />
                                </button>
                                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                                    <Video className="h-4 w-4" />
                                </button>

                                {/* 3-Dots Menu Button */}
                                {canDeleteChat && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            className={cn("p-2 rounded-lg transition-colors", showMenu ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50")}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showMenu && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={() => { setStateDeleteConfirm(true); setShowMenu(false); }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete History
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Confirmation */}
                        <Modal
                            isOpen={stateDeleteConfirm}
                            onClose={() => setStateDeleteConfirm(false)}
                            title="Delete Chat History"
                        >
                            <div className="space-y-4">
                                <p className="text-slate-600">
                                    Are you sure you want to delete all messages with <span className="font-semibold text-slate-900">{activeContact.full_name}</span>? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setStateDeleteConfirm(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteChat}
                                        disabled={isDeleting}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-200 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isDeleting ? "Deleting..." : "Delete History"}
                                    </button>
                                </div>
                            </div>
                        </Modal>


                        {/* Messages Area - Clean Background */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            {isLoadingMessages ? (
                                <div className="flex justify-center p-10"><div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                    <p className="text-sm">No messages yet. Say hello!</p>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-1">
                                    {messages.map((msg, idx) => {
                                        const isMe = msg.sender_id === currentUserId;
                                        const isChain = idx > 0 && messages[idx - 1].sender_id === msg.sender_id;

                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={msg.id}
                                                className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
                                            >
                                                <div className={cn(
                                                    "max-w-[70%] px-4 py-2.5 text-sm shadow-sm relative transition-all",
                                                    isMe
                                                        ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
                                                        : "bg-white border border-slate-200 text-slate-900 rounded-2xl rounded-tl-sm",
                                                    isChain && "mt-1"
                                                )}>
                                                    {/* Image Media */}
                                                    {msg.file_type === 'image' && msg.file_url && (
                                                        <img
                                                            src={msg.file_url}
                                                            alt="attachment"
                                                            className="rounded-lg mb-2 max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-black/5"
                                                        />
                                                    )}

                                                    {/* Audio Media */}
                                                    {msg.file_type === 'audio' && msg.file_url && (
                                                        <audio controls className="h-8 mb-2 w-full max-w-[240px]">
                                                            <source src={msg.file_url} type="audio/mpeg" />
                                                        </audio>
                                                    )}

                                                    {msg.content && <div className="leading-relaxed">{renderMessageContent(msg.content)}</div>}
                                                    <div className={cn(
                                                        "text-[9px] mt-1 flex items-center gap-1",
                                                        isMe ? "text-indigo-100 justify-end" : "text-slate-400"
                                                    )}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && <CheckCheck className="h-3 w-3" />}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Clean Style */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/5 transition-all">
                                <div className="relative">
                                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} accept="image/*,audio/*" disabled={isUploading} />
                                    <label htmlFor="file-upload" className={cn("p-2 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer flex items-center justify-center rounded-full hover:bg-slate-100", isUploading && "animate-pulse")}>
                                        <Paperclip className="h-5 w-5" />
                                    </label>
                                </div>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-900 py-2 placeholder:text-slate-400"
                                />

                                <div className="flex items-center gap-1">
                                    <button type="button" className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                                        <Smile className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className={cn(
                                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                                            newMessage.trim()
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95"
                                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        )}
                                    >
                                        <Send className="h-4 w-4 ml-0.5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )
                }
            </div >
        </div >
    );
}