import React, { useState } from 'react';
import { Post, Comment } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { X, Heart, Send, CornerDownRight, MessageCircle } from 'lucide-react';

interface CommentsSheetProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({ post, isOpen, onClose }) => {
  const { addComment, likeComment } = useData();
  const { currentUser } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addComment(post.id, commentText, replyingTo?.id);
    setCommentText('');
    setReplyingTo(null);
  };

  const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😍', '✨', '🙌', '💯', '🇵🇰'];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center">
      <div
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] h-[650px] flex flex-col shadow-2xl overflow-hidden animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#FACC15]" />
            <h3 className="font-bold text-sm text-white">
              Comments ({post.comments?.length || 0})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(!post.comments || post.comments.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-zinc-300 font-semibold text-sm">No comments yet</p>
              <p className="text-zinc-500 text-xs">Be the first to start the Mehfil conversation!</p>
            </div>
          ) : (
            post.comments.map(comment => (
              <div key={comment.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-2.5 flex-1">
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white hover:underline cursor-pointer">
                          {comment.authorUsername}
                        </span>
                        <span className="text-[10px] text-zinc-500">{comment.createdAt}</span>
                      </div>
                      <p className="text-zinc-200 mt-0.5 leading-relaxed">{comment.text}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo({ id: comment.id, username: comment.authorUsername });
                          setCommentText(`@${comment.authorUsername} `);
                        }}
                        className="text-[11px] text-zinc-400 hover:text-[#FACC15] font-medium mt-1 inline-block"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => likeComment(post.id, comment.id)}
                    className="flex flex-col items-center text-zinc-500 hover:text-[#EF4444] transition-colors pt-1"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        currentUser && comment.likedBy?.includes(currentUser.id)
                          ? 'fill-[#EF4444] text-[#EF4444]'
                          : ''
                      }`}
                    />
                    <span className="text-[10px] mt-0.5">
                      {comment.likesCount > 0 ? comment.likesCount : ''}
                    </span>
                  </button>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-9 space-y-2 border-l border-zinc-800/80 ml-4 mt-1">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2 flex-1">
                          <img
                            src={reply.authorAvatar}
                            alt={reply.authorName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                          <div className="text-xs flex-1">
                            <span className="font-bold text-white">{reply.authorUsername}</span>{' '}
                            <span className="text-[10px] text-zinc-500">{reply.createdAt}</span>
                            <p className="text-zinc-300 mt-0.5">{reply.text}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => likeComment(post.id, reply.id)}
                          className="flex flex-col items-center text-zinc-500 hover:text-[#EF4444] transition-colors"
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              currentUser && reply.likedBy?.includes(currentUser.id)
                                ? 'fill-[#EF4444] text-[#EF4444]'
                                : ''
                            }`}
                          />
                          <span className="text-[9px]">
                            {reply.likesCount > 0 ? reply.likesCount : ''}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Emoji Bar */}
        <div className="px-4 py-2 bg-zinc-900/60 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => setCommentText(prev => prev + emoji)}
              className="p-1 hover:scale-125 transition-transform text-sm"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Replying indicator */}
        {replyingTo && (
          <div className="px-4 py-1.5 bg-yellow-950/40 border-t border-[#FACC15]/20 flex items-center justify-between text-xs text-[#FACC15]">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5" />
              Replying to @{replyingTo.username}
            </span>
            <button
              onClick={() => {
                setReplyingTo(null);
                setCommentText('');
              }}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
          {currentUser && (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          )}
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={
              replyingTo
                ? `Replying to @${replyingTo.username}...`
                : 'Add a comment to the Mehfil...'
            }
            className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-full py-2.5 px-4 placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2.5 bg-[#FACC15] hover:bg-yellow-400 text-black rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
