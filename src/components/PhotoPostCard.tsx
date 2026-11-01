import React, { useState } from 'react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CommentsSheet } from './CommentsSheet';
import { ShareModal } from './ShareModal';
import { ReportModal } from './ReportModal';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  Send,
  Lock,
} from 'lucide-react';

interface PhotoPostCardProps {
  post: Post;
  onSelectUser?: (userId: string) => void;
}

export const PhotoPostCard: React.FC<PhotoPostCardProps> = ({ post, onSelectUser }) => {
  const { currentUser, blockUser } = useAuth();
  const { toggleLikePost, toggleSavePost, addComment, deletePost, setActivePostId } = useData();

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [quickComment, setQuickComment] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const isLiked = currentUser && post.likedBy?.includes(currentUser.id);
  const isSaved =
    currentUser &&
    (post.savedBy?.includes(currentUser.id) || currentUser.savedPosts?.includes(post.id));
  const isOwner = currentUser && currentUser.id === post.authorId;

  const handleDoubleTap = () => {
    toggleLikePost(post.id);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 800);
  };

  const handleQuickCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickComment.trim()) return;
    addComment(post.id, quickComment);
    setQuickComment('');
  };

  return (
    <article className="w-full max-w-lg mx-auto bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Post Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-zinc-800/60">
        <div
          onClick={() => onSelectUser && onSelectUser(post.authorId)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#EF4444] to-[#FACC15] shrink-0">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white group-hover:underline">
                {post.authorName}
              </span>
              {post.visibility === 'followers' && (
                <span title="Followers only" className="inline-flex items-center">
                  <Lock className="w-3 h-3 text-zinc-400" />
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">@{post.authorUsername}</p>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-8 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-30 text-xs"
              onClick={() => setIsMenuOpen(false)}
            >
              {isOwner ? (
                <button
                  onClick={() => deletePost(post.id)}
                  className="w-full px-3 py-2 text-left text-[#EF4444] hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Report Post
                  </button>
                  <button
                    onClick={() => blockUser(post.authorId)}
                    className="w-full px-3 py-2 text-left text-[#EF4444] hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Block User
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Media (Photo) - click opens FullPostModal, double tap likes */}
      <div
        className="relative aspect-square w-full bg-zinc-900 overflow-hidden cursor-pointer"
        onClick={() => setActivePostId(post.id)}
        onDoubleClick={e => {
          e.stopPropagation();
          handleDoubleTap();
        }}
      >
        <img
          src={post.mediaUrl}
          alt={post.caption}
          className="w-full h-full object-cover select-none"
        />

        {/* Double-tap animated heart burst */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-28 h-28 text-[#EF4444] fill-[#EF4444] animate-heart-burst drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]" />
          </div>
        )}
      </div>

      {/* Action Bar (Like, Comment, Share, Save) */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={() => {
                toggleLikePost(post.id);
                if (!isLiked) {
                  setShowHeartBurst(true);
                  setTimeout(() => setShowHeartBurst(false), 800);
                }
              }}
              className="flex items-center gap-1.5 group transition-transform active:scale-75"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked ? 'fill-[#EF4444] text-[#EF4444]' : 'text-zinc-300 group-hover:text-red-400'
                }`}
              />
              <span className="text-xs font-semibold text-zinc-200">
                {post.likesCount}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={() => setIsCommentsOpen(true)}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white group"
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold">
                {post.commentsCount || post.comments?.length || 0}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="text-zinc-300 hover:text-white transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          {/* Bookmark / Save */}
          <button
            onClick={() => toggleSavePost(post.id)}
            className="text-zinc-300 hover:text-white transition-colors"
          >
            <Bookmark
              className={`w-6 h-6 ${
                isSaved ? 'fill-[#FACC15] text-[#FACC15]' : ''
              }`}
            />
          </button>
        </div>

        {/* Caption */}
        <div className="text-xs leading-relaxed pt-1">
          <span
            onClick={() => onSelectUser && onSelectUser(post.authorId)}
            className="font-bold text-white mr-2 cursor-pointer hover:underline"
          >
            {post.authorUsername}
          </span>
          <span className="text-zinc-300">{post.caption}</span>
        </div>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-xs text-[#FACC15] font-semibold">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="hover:underline cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* View all comments link */}
        {post.comments && post.comments.length > 0 && (
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-medium block pt-0.5"
          >
            View all {post.comments.length} comments
          </button>
        )}

        {/* Quick add comment bar */}
        <form onSubmit={handleQuickCommentSubmit} className="pt-2 flex items-center gap-2 border-t border-zinc-900">
          <input
            type="text"
            value={quickComment}
            onChange={e => setQuickComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          {quickComment.trim() && (
            <button
              type="submit"
              className="text-xs font-bold text-[#FACC15] hover:text-yellow-300 transition-colors"
            >
              Post
            </button>
          )}
        </form>
      </div>

      {/* Sheet Modals */}
      <CommentsSheet
        post={post}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      />
      <ShareModal
        post={post}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
      <ReportModal
        targetId={post.id}
        targetType="post"
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </article>
  );
};
