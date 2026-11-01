import React, { useState } from 'react';
import { Post, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { X, Copy, Check, Send, Share2 } from 'lucide-react';

interface ShareModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, isOpen, onClose }) => {
  const { users } = useAuth();
  const { openOrCreateConversationWithUser, sendMessage } = useData();
  const [copied, setCopied] = useState(false);
  const [sentUsers, setSentUsers] = useState<string[]>([]);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/#post_${post.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToUser = (targetUser: User) => {
    const conv = openOrCreateConversationWithUser(targetUser);
    sendMessage(
      conv.id,
      `Check out this Mehfil post by @${post.authorUsername}: "${post.caption.slice(0, 50)}..."\n${shareUrl}`,
      post.thumbnailUrl || post.mediaUrl
    );
    setSentUsers(prev => [...prev, targetUser.id]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#FACC15]" />
            <h3 className="font-bold text-sm text-white">Share Post</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Link button */}
        <div className="p-3 bg-zinc-900 rounded-2xl flex items-center justify-between gap-2 border border-zinc-800">
          <div className="truncate text-xs text-zinc-300 font-mono">
            {shareUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 bg-[#FACC15] hover:bg-yellow-400 text-black font-semibold text-xs py-2 px-3 rounded-xl shrink-0 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Quick Send via DM */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400">Send to Friends in Mehfil</p>
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {users.slice(0, 4).map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="text-xs">
                    <p className="font-semibold text-white leading-tight">{u.name}</p>
                    <p className="text-zinc-500 text-[11px]">@{u.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendToUser(u)}
                  disabled={sentUsers.includes(u.id)}
                  className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all ${
                    sentUsers.includes(u.id)
                      ? 'bg-zinc-800 text-zinc-500 cursor-default'
                      : 'bg-zinc-800 hover:bg-[#FACC15] text-white hover:text-black'
                  }`}
                >
                  {sentUsers.includes(u.id) ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Sent
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Send
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
