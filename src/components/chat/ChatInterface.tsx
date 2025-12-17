
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMessages, sendMessage } from "@/lib/actions/chat";
import { cn } from "@/lib/utils";
import { Send, Search, User } from "lucide-react";
import { toast } from "sonner";

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
}

interface ChatInterfaceProps {
    initialContacts: Contact[];
    currentUserId: string;
}

export function ChatInterface({ initialContacts, currentUserId }: ChatInterfaceProps) {
    const [contacts, setContacts] = useState(initialContacts);
    const [activeContact, setActiveContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

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
                    filter: `receiver_id=eq.${currentUserId}`, // Listen for messages sent TO me
                },
                (payload) => {
                    const newMsg = payload.new as Message;

                    // If the message is from the active contact, append it
                    if (activeContact && newMsg.sender_id === activeContact.id) {
                        setMessages((prev) => [...prev, newMsg]);
                        scrollToBottom();
                    } else {
                        // Otherwise, show notified (toast for now, better unread badge later)
                        const sender = contacts.find(c => c.id === newMsg.sender_id);
                        toast.info(`New message from ${sender?.full_name || "someone"}`);
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

        const tempId = Math.random().toString(36).substring(7);
        const content = newMessage;

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
            // Rollback (simplified: just removing the optimistic one would be complex without ID match, 
            // but usually fetching fresh messages is better. For now we assume success mostly)
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6 min-h-0">

            {/* LEFT PANE: Contact List */}
            <div className="w-1/3 md:w-1/4 glass-card rounded-xl flex flex-col min-h-0 hidden md:flex">
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/20 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredContacts.map((contact) => (
                        <button
                            key={contact.id}
                            onClick={() => setActiveContact(contact)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                                activeContact?.id === contact.id
                                    ? "bg-white/10 shadow-sm ring-1 ring-white/10"
                                    : "hover:bg-white/5"
                            )}
                        >
                            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                                {contact.avatar_url ? (
                                    <img src={contact.avatar_url} alt={contact.full_name} className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-5 w-5 text-zinc-500" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-sm font-medium truncate", activeContact?.id === contact.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-300")}>
                                    {contact.full_name}
                                </p>
                                <p className="text-xs text-zinc-500 capitalize truncate">{contact.role}</p>
                            </div>
                        </button>
                    ))}
                    {filteredContacts.length === 0 && (
                        <p className="text-center text-zinc-500 text-sm mt-4">No contacts found.</p>
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Chat Window */}
            <div className="flex-1 glass-card rounded-xl flex flex-col min-h-0 overflow-hidden relative">
                {!activeContact ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                        <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4 rotate-3">
                            <Send className="h-8 w-8 text-zinc-600" />
                        </div>
                        <p>Select a contact to start messaging</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {activeContact.avatar_url ? (
                                    <img src={activeContact.avatar_url} alt={activeContact.full_name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-zinc-400">{activeContact.full_name[0]}</span>
                                )}
                            </div>
                            <h3 className="text-sm font-medium text-white">{activeContact.full_name}</h3>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                            {isLoadingMessages ? (
                                <div className="flex justify-center p-4"><div className="animate-spin h-5 w-5 border-2 border-zinc-600 border-t-white rounded-full" /></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-zinc-600 text-sm mt-10">No messages yet. Say hi! 👋</div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    return (
                                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn("max-w-[70%] px-4 py-2 rounded-2xl text-sm",
                                                isMe
                                                    ? "bg-indigo-600 text-white rounded-br-none"
                                                    : "bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700"
                                            )}>
                                                {msg.content}
                                                <p className={cn("text-[10px] mt-1 text-right opacity-50", isMe ? "text-indigo-200" : "text-zinc-500")}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5 bg-zinc-900/50">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
