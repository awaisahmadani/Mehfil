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
  ShieldAlert,
  X,
  UserCheck,
} from 'lucide-react';

interface MessagesScreenProps {
  onSelectUser: (userId: string) => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onSelectUser }) => {
  const { currentUser, blockUser, unblockUser, users } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    getMessagesForChat,
    sendMessage,
    deleteMessage,
    markConversationSeen,
    openOrCreateConversationWithUser,
    acceptMessageRequest,
    isTypingUserId,
  } = useData();

  const [activeTab, setActiveTab] = useState<'primary' | 'requests'>('primary');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteTargetMessage, setDeleteTargetMessage] = useState<Message | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active messages fetched dynamically for the active conversation
  const activeMessages = activeConversation
    ? getMessagesForChat(activeConversation.id)
    : [];

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, isTypingUserId]);

  // Mark as seen when conversation opens
  useEffect(() => {
    if (activeConversation) {
      markConversationSeen(activeConversation.id);
    }
  }, [activeConversation?.id]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeConversation || (!messageText.trim() && !selectedPhoto)) return;

    // Check if blocked
    if (currentUser?.blockedUsers?.includes(activeConversation.otherUser.id)) {
      return;
    }

    sendMessage(activeConversation.id, messageText, selectedPhoto || undefined);
    setMessageText('');
    setSelectedPhoto(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  // Filter conversations for the current tab and search query
  const filteredConversations = conversations
    .filter(c => {
      // Must include current user
      if (!c.participantIds.includes(currentUser?.id || '')) return false;

      if (activeTab === 'requests') {
        if (!c.isRequest) return false;
      } else {
        if (c.isRequest) return false;
      }

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        c.otherUser.name.toLowerCase().includes(q) ||
        c.otherUser.username.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || a.updatedAt).getTime();
      const timeB = new Date(b.lastMessageTime || b.updatedAt).getTime();
      return timeB - timeA;
    });

  const EMOJIS = ['❤️', '🔥', '😂', '👏', '😍', '✨', '🙌', '💯', '🌸', '☕', '🇵🇰'];

  // ============================================================
  // VIEW: SINGLE ACTIVE CHAT ROOM
  // ============================================================
  if (activeConversation) {
    const other = activeConversation.otherUser;
    const isTyping = isTypingUserId === other.id;
    const isBlockedByMe = currentUser?.blockedUsers?.includes(other.id);

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
                {isBlockedByMe ? (
                  <button
                    onClick={() => unblockUser(other.id)}
                    className="w-full px-3 py-2 text-left text-emerald-400 hover:bg-zinc-800"
                  >
                    Unblock User
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      blockUser(other.id);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[#EF4444] hover:bg-zinc-800"
                  >
                    Block User
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message Requests Banner (If users don't follow each other) */}
        {activeConversation.isRequest && (
          <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[#FACC15] text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Message Request</span>
            </div>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
              You and @{other.username} do not follow each other. Accept this request to allow direct messages to appear in your primary inbox.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => acceptMessageRequest(activeConversation.id)}
                className="bg-[#FACC15] hover:bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Accept Request
              </button>
              <button
                onClick={() => {
                  blockUser(other.id);
                  setActiveConversation(null);
                }}
                className="bg-zinc-800 hover:bg-red-950/40 text-zinc-300 hover:text-red-400 px-3 py-1.5 rounded-xl text-xs transition-colors"
              >
                Block
              </button>
            </div>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-500">
              <img
                src={other.avatarUrl}
                alt={other.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-zinc-800"
              />
              <p className="text-white font-bold text-sm">{other.name}</p>
              <p className="text-xs text-zinc-400">@{other.username}</p>
              <p className="text-[11px] text-zinc-500 pt-2">
                No messages yet. Send a message to start the Mehfil chat!
              </p>
            </div>
          ) : (
            activeMessages.map(msg => {
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
                        className="rounded-xl mb-1.5 max-h-56 w-full object-cover"
                      />
                    )}

                    <p
                      className={`leading-relaxed break-words whitespace-pre-wrap ${
                        msg.deletedForEveryone ? 'italic text-zinc-500' : ''
                      }`}
                    >
                      {msg.text}
                    </p>
                  </div>

                  {/* Timestamp, delivery status & Delete action */}
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1 px-1">
                    <span>{msg.createdAt}</span>
                    {isMe && !msg.deletedForEveryone && (
                      <span>
                        {msg.seen ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-zinc-400 inline" />
                        )}
                      </span>
                    )}

                    {/* Delete Message Trigger */}
                    {!msg.deletedForEveryone && (
                      <button
                        onClick={() => setDeleteTargetMessage(msg)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1 p-0.5"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Real-time Typing Indicator */}
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

        {/* Blocked Advisory Banner */}
        {isBlockedByMe ? (
          <div className="p-3 bg-red-950/40 border-t border-red-900/60 text-center text-xs text-red-300 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
            <span>You have blocked this user. Unblock them to send messages.</span>
          </div>
        ) : (
          <>
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
                onKeyDown={handleKeyDown}
                placeholder="Type a message (Press Enter to send)..."
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
          </>
        )}

        {/* Delete Message Scope Dialog (Delete for me vs Delete for everyone) */}
        {deleteTargetMessage && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div
              className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <h4 className="font-bold text-white text-sm">Delete message?</h4>
              <p className="text-xs text-zinc-400">
                Choose how you want this message deleted.
              </p>

              <div className="space-y-2 pt-1">
                {currentUser && deleteTargetMessage.senderId === currentUser.id && (
                  <button
                    onClick={() => {
                      deleteMessage(activeConversation.id, deleteTargetMessage.id, 'everyone');
                      setDeleteTargetMessage(null);
                    }}
                    className="w-full py-2 px-3 bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Delete for everyone
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteMessage(activeConversation.id, deleteTargetMessage.id, 'me');
                    setDeleteTargetMessage(null);
                  }}
                  className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Delete for me
                </button>
                <button
                  onClick={() => setDeleteTargetMessage(null)}
                  className="w-full py-1.5 text-xs text-zinc-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
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
          Firestore Realtime
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
          className={`flex-1 py-2 font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'requests'
              ? 'border-[#FACC15] text-[#FACC15]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <span>Requests</span>
          {conversations.some(c => c.isRequest && c.unreadCount > 0) && (
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
          )}
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
            <p className="text-[11px]">
              {activeTab === 'requests'
                ? 'Messages from users who don’t follow you will appear here.'
                : 'Find creators in Search and tap Message to begin!'}
            </p>
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
