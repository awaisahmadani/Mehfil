import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Send,
  Image as ImageIcon,
  ArrowLeft,
  MoreVertical,
  Check,
  CheckCheck,
  Smile,
  Trash2,
  Lock,
  Search,
  AlertCircle,
} from 'lucide-react';

interface MessagesScreenProps {
  onSelectUser: (userId: string) => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onSelectUser }) => {
  const { currentUser, blockUser, users } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    deleteMessage,
    markConversationSeen,
    openOrCreateConversationWithUser,
    isTypingUserId,
  } = useData();

  const [activeTab, setActiveTab] = useState<'primary' | 'requests'>('primary');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.lastMessage, isTypingUserId]);

  // Mark as seen when conversation opens
  useEffect(() => {
    if (activeConversation) {
      markConversationSeen(activeConversation.id);
    }
  }, [activeConversation]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || (!messageText.trim() && !selectedPhoto)) return;

    sendMessage(activeConversation.id, messageText, selectedPhoto || undefined);
    setMessageText('');
    setSelectedPhoto(null);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'requests') {
      if (!c.isRequest) return false;
    } else {
      if (c.isRequest) return false;
    }

    if (!searchTerm.trim()) return true;
    return (
      c.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.otherUser.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const EMOJIS = ['❤️', '🔥', '😂', '👏', '😍', '✨', '🙌', '💯', '🌸', '☕', '🇵🇰'];

  // ============================================================
  // VIEW: SINGLE ACTIVE CHAT ROOM
  // ============================================================
  if (activeConversation) {
    const other = activeConversation.otherUser;
    const isTyping = isTypingUserId === other.id;

    // Simulated dummy message history for a lively conversation
    const conversationHistory: Message[] = [
      {
        id: 'hist_1',
        conversationId: activeConversation.id,
        senderId: other.id,
        senderName: other.name,
        senderAvatar: other.avatarUrl,
        text: `Salam! Welcome to Mehfil! Enjoying the vibe here? ✨`,
        createdAt: '10:14 AM',
        seen: true,
      },
      ...(activeConversation.lastMessage ? [activeConversation.lastMessage] : []),
    ];

    return (
      <div className="w-full max-w-lg mx-auto h-[86vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveConversation(null)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              onClick={() => onSelectUser(other.id)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="relative">
                <img
                  src={other.avatarUrl}
                  alt={other.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-900" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white hover:underline leading-none">{other.name}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isTyping ? (
                    <span className="text-[#FACC15] font-semibold animate-pulse">
                      typing...
                    </span>
                  ) : (
                    `@${other.username}`
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-9 w-40 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl py-1 z-30 text-xs"
                onClick={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => onSelectUser(other.id)}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    blockUser(other.id);
                    setActiveConversation(null);
                  }}
                  className="w-full px-3 py-2 text-left text-[#EF4444] hover:bg-zinc-800"
                >
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Privacy advisory banner if message request */}
          {activeConversation.isRequest && (
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-center space-y-1">
              <Lock className="w-4 h-4 text-[#FACC15] mx-auto" />
              <p className="text-xs font-semibold text-zinc-200">Message Request</p>
              <p className="text-[11px] text-zinc-400">
                This account is private. They won't know you read their message until you reply.
              </p>
            </div>
          )}

          {conversationHistory.map(msg => {
            const isMe = currentUser && msg.senderId === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                    isMe
                      ? 'bg-[#FACC15] text-black rounded-tr-xs'
                      : 'bg-zinc-900 border border-zinc-800 text-white rounded-tl-xs'
                  }`}
                >
                  {/* Photo if attached */}
                  {msg.mediaUrl && (
                    <img
                      src={msg.mediaUrl}
                      alt="Attached media"
                      className="rounded-xl mb-1.5 max-h-48 w-full object-cover"
                    />
                  )}

                  <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Timestamp and delivery status */}
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1 px-1">
                  <span>{msg.createdAt}</span>
                  {isMe && (
                    <span>
                      {msg.seen ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-zinc-400 inline" />
                      )}
                    </span>
                  )}
                  {isMe && (
                    <button
                      onClick={() => deleteMessage(activeConversation.id, msg.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
              <img
                src={other.avatarUrl}
                alt={other.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <div className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#FACC15] rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-[#FACC15] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-[#FACC15] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected Photo preview banner */}
        {selectedPhoto && (
          <div className="p-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={selectedPhoto} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-xs text-zinc-300">Photo attached</span>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Quick Emoji Bar */}
        {showEmojiPicker && (
          <div className="p-2 bg-zinc-900/95 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {EMOJIS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => setMessageText(prev => prev + em)}
                className="p-1 hover:scale-125 transition-transform text-sm"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            title="Attach photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-zinc-400 hover:text-[#FACC15] rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-full py-2.5 px-4 placeholder-zinc-500"
          />

          <button
            type="submit"
            disabled={!messageText.trim() && !selectedPhoto}
            className="p-2.5 bg-[#FACC15] hover:bg-yellow-400 text-black rounded-full disabled:opacity-40 transition-colors shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // ============================================================
  // VIEW: INBOX LIST
  // ============================================================
  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white">Direct Messages</h2>
        <span className="text-xs text-[#FACC15] font-semibold bg-yellow-950/40 border border-[#FACC15]/30 px-2.5 py-1 rounded-full">
          Realtime
        </span>
      </div>

      {/* Search Inbox */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search chats or start new conversation..."
          className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-2xl py-2.5 pl-10 pr-4 placeholder-zinc-500"
        />
      </div>

      {/* Primary vs Requests Tabs */}
      <div className="flex items-center border-b border-zinc-800 text-xs">
        <button
          onClick={() => setActiveTab('primary')}
          className={`flex-1 py-2 font-bold text-center border-b-2 transition-colors ${
            activeTab === 'primary'
              ? 'border-[#FACC15] text-[#FACC15]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Primary Messages
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 font-bold text-center border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-[#FACC15] text-[#FACC15]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Requests
        </button>
      </div>

      {/* Suggested new chats if user searches */}
      {searchTerm && (
        <div className="space-y-1.5 pb-2">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Start new chat with creator
          </p>
          {users
            .filter(
              u =>
                u.id !== currentUser?.id &&
                (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.username.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .slice(0, 3)
            .map(u => (
              <div
                key={u.id}
                onClick={() => openOrCreateConversationWithUser(u)}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="text-xs">
                    <p className="font-bold text-white">{u.name}</p>
                    <p className="text-zinc-400 text-[11px]">@{u.username}</p>
                  </div>
                </div>
                <span className="text-[11px] text-[#FACC15] font-semibold">Message</span>
              </div>
            ))}
        </div>
      )}

      {/* Conversation List */}
      <div className="space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-zinc-500">
            <AlertCircle className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs font-semibold text-zinc-400">No conversations in this tab</p>
            <p className="text-[11px]">Find creators in Search and tap Message to begin!</p>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const hasUnread = conv.unreadCount > 0;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  hasUnread
                    ? 'bg-zinc-900/90 border-[#FACC15]/40 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 mr-2">
                  <div className="relative shrink-0">
                    <img
                      src={conv.otherUser.avatarUrl}
                      alt={conv.otherUser.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                  </div>
                  <div className="text-xs truncate flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold truncate ${hasUnread ? 'text-[#FACC15]' : 'text-white'}`}>
                        {conv.otherUser.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {conv.lastMessage?.createdAt || 'Active'}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? 'font-semibold text-zinc-200' : 'text-zinc-400'}`}>
                      {conv.lastMessage?.text || 'Started a conversation'}
                    </p>
                  </div>
                </div>

                {hasUnread && (
                  <span className="w-5 h-5 rounded-full bg-[#FACC15] text-black font-bold text-[10px] flex items-center justify-center shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
