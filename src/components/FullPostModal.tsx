import React, { useState, useEffect, useRef } from 'react';
import { Post, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ShareModal } from './ShareModal';
import { ReportModal } from './ReportModal';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Lock,
  Globe,
  Users,
  Edit2,
  Trash2,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  AlertCircle,
  Loader2,
  Smile,
  Check,
} from 'lucide-react';

interface FullPostModalProps {
  postId: string;
  postList?: Post[];
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const FullPostModal: React.FC<FullPostModalProps> = ({
  postId,
  postList = [],
  onClose,
  onSelectUser,
}) => {
  const { currentUser, users } = useAuth();
  const {
    posts,
    toggleLikePost,
    toggleSavePost,
    addComment,
    likeComment,
    deletePost,
    editPost,
  } = useData();

  // Find post in current posts or postList
  const currentPost = posts.find(p => p.id === postId) || postList.find(p => p.id === postId);

  // Author details
  const authorUser: User | undefined = users.find(u => u.id === currentPost?.authorId);

  // Index in list for next/prev navigation
  const currentIndex = postList.findIndex(p => p.id === postId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < postList.length - 1;

  // State
  const [commentText, setCommentText] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(currentPost?.caption || '');
  const [editVisibility, setEditVisibility] = useState<'public' | 'followers' | 'private'>(
    currentPost?.visibility || 'public'
  );
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (currentPost) {
      setEditCaption(currentPost.caption);
      setEditVisibility(currentPost.visibility);
      // Update browser hash so URL can be shared or refreshed directly
      window.location.hash = `/post/${currentPost.id}`;
    }
  }, [postId, currentPost]);

  const isOwner = currentUser && currentPost && currentUser.id === currentPost.authorId;
  const isFollowingAuthor = currentUser && authorUser && currentUser.following?.includes(authorUser.id);
  const isPrivateAuthor = authorUser?.isPrivate;

  // Privacy rule: if author is private, and viewer is not owner and not following
  const isLocked = isPrivateAuthor && !isOwner && !isFollowingAuthor;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasPrev) {
      const prevPost = postList[currentIndex - 1];
      window.location.hash = `/post/${prevPost.id}`;
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasNext) {
      const nextPost = postList[currentIndex + 1];
      window.location.hash = `/post/${nextPost.id}`;
    }
  };

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleDoubleTap = () => {
    if (!currentPost) return;
    toggleLikePost(currentPost.id);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 800);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentPost) return;
    addComment(currentPost.id, commentText);
    setCommentText('');
    setShowEmojiPicker(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost) return;
    editPost(currentPost.id, {
      caption: editCaption.trim(),
      visibility: editVisibility,
    });
    setIsEditing(false);
    setOptionsOpen(false);
  };

  const handleDelete = () => {
    if (!currentPost) return;
    deletePost(currentPost.id);
    onClose();
  };

  const EMOJIS = ['❤️', '🔥', '👏', '😍', '✨', '🙌', '💯', '🌸', '☕', '🇵🇰'];

  // Loading or not found state
  if (!currentPost) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-white text-base">Post Not Found</h3>
          <p className="text-xs text-zinc-400">
            This post may have been removed or the link is invalid.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isLiked = currentUser && currentPost.likedBy?.includes(currentUser.id);
  const isSaved =
    currentUser &&
    (currentPost.savedBy?.includes(currentUser.id) ||
      currentUser.savedPosts?.includes(currentPost.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Close button top right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full border border-zinc-700/80 transition-all"
        title="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev / Next navigation for lists */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-full border border-zinc-700 transition-all"
          title="Previous post"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-full border border-zinc-700 transition-all"
          title="Next post"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Post Card Container */}
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-30"
        onClick={e => e.stopPropagation()}
      >
        {/* ============================================================ */}
        {/* LEFT / TOP: MEDIA CONTAINER                                  */}
        {/* ============================================================ */}
        <div className="relative w-full md:w-[58%] bg-black flex items-center justify-center min-h-[300px] md:min-h-[580px] overflow-hidden">
          {isLocked ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-[#FACC15]">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-white text-base">This post is private</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Follow @{authorUser?.username || currentPost.authorUsername} to see their photos and videos.
              </p>
            </div>
          ) : currentPost.type === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={currentPost.mediaUrl}
                poster={currentPost.thumbnailUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                onClick={handleTogglePlay}
                className="w-full max-h-[70vh] md:max-h-[85vh] object-contain cursor-pointer"
              />

              {/* Video control overlay */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#FACC15]" />}
                </button>
              </div>

              {!isPlaying && (
                <div
                  onClick={handleTogglePlay}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                >
                  <Play className="w-12 h-12 text-white fill-white" />
                </div>
              )}
            </div>
          ) : (
            <div
              className="relative w-full h-full flex items-center justify-center cursor-pointer"
              onDoubleClick={handleDoubleTap}
            >
              <img
                src={currentPost.mediaUrl}
                alt={currentPost.caption}
                className="w-full max-h-[70vh] md:max-h-[85vh] object-contain select-none"
              />
            </div>
          )}

          {/* Double Tap Heart Burst */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-28 h-28 text-[#EF4444] fill-[#EF4444] animate-heart-burst drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]" />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT / BOTTOM: DETAILS & COMMENTS CONTAINER                  */}
        {/* ============================================================ */}
        <div className="w-full md:w-[42%] flex flex-col justify-between bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div
              onClick={() => {
                onSelectUser(currentPost.authorId);
                onClose();
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#EF4444] to-[#FACC15]">
                <img
                  src={currentPost.authorAvatar}
                  alt={currentPost.authorName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white group-hover:underline">
                    {currentPost.authorName}
                  </span>
                  {currentPost.visibility === 'followers' && (
                    <Users className="w-3 h-3 text-zinc-400" />
                  )}
                  {currentPost.visibility === 'private' && (
                    <Lock className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
                <p className="text-zinc-400 text-[11px]">@{currentPost.authorUsername}</p>
              </div>
            </div>

            {/* Menu options button */}
            <div className="relative">
              <button
                onClick={() => setOptionsOpen(!optionsOpen)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {optionsOpen && (
                <div
                  className="absolute right-0 top-8 w-48 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl py-1.5 z-40 text-xs"
                  onClick={() => setOptionsOpen(false)}
                >
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full px-3.5 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4 text-[#FACC15]" />
                        Edit Caption & Privacy
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-3.5 py-2 text-left text-[#EF4444] hover:bg-zinc-800 flex items-center gap-2 border-t border-zinc-800/80"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsReportOpen(true)}
                      className="w-full px-3.5 py-2 text-left text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Report Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Caption & Comments Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {/* Caption */}
            <div className="flex items-start gap-2.5 pb-2 border-b border-zinc-800/60">
              <img
                src={currentPost.authorAvatar}
                alt={currentPost.authorName}
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <span className="font-bold text-white mr-1.5">
                  {currentPost.authorUsername}
                </span>
                <span className="text-zinc-200 leading-relaxed">{currentPost.caption}</span>

                {/* Hashtags */}
                {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 text-[#FACC15] font-semibold text-[11px]">
                    {currentPost.hashtags.map((h, i) => (
                      <span key={i}>{h}</span>
                    ))}
                  </div>
                )}
                <span className="text-[10px] text-zinc-500 block mt-1">
                  {new Date(currentPost.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Comments List */}
            {currentPost.comments && currentPost.comments.length > 0 ? (
              currentPost.comments.map(c => (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <img
                        src={c.authorAvatar}
                        alt={c.authorName}
                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-white mr-1.5">{c.authorUsername}</span>
                        <span className="text-zinc-300">{c.text}</span>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                          <span>{c.createdAt}</span>
                          <button
                            type="button"
                            onClick={() => setCommentText(`@${c.authorUsername} `)}
                            className="hover:text-[#FACC15]"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => likeComment(currentPost.id, c.id)}
                      className="text-zinc-500 hover:text-[#EF4444] p-1 flex flex-col items-center"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          currentUser && c.likedBy?.includes(currentUser.id)
                            ? 'fill-[#EF4444] text-[#EF4444]'
                            : ''
                        }`}
                      />
                      {c.likesCount > 0 && (
                        <span className="text-[9px] mt-0.5">{c.likesCount}</span>
                      )}
                    </button>
                  </div>

                  {/* Replies if any */}
                  {c.replies?.map(r => (
                    <div key={r.id} className="pl-9 flex items-start gap-2">
                      <img
                        src={r.authorAvatar}
                        alt={r.authorName}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                      <div className="text-xs flex-1">
                        <span className="font-bold text-white mr-1.5">{r.authorUsername}</span>
                        <span className="text-zinc-300">{r.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-500 text-xs py-8">
                No comments yet. Start the Mehfil conversation!
              </p>
            )}
          </div>

          {/* Action Row & Add Comment Input */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleLikePost(currentPost.id)}
                  className="p-1 text-zinc-300 hover:text-white transition-transform active:scale-75"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isLiked ? 'fill-[#EF4444] text-[#EF4444]' : ''
                    }`}
                  />
                </button>
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="p-1 text-zinc-300 hover:text-white"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => toggleSavePost(currentPost.id)}
                className="p-1 text-zinc-300 hover:text-white"
              >
                <Bookmark
                  className={`w-6 h-6 ${
                    isSaved ? 'fill-[#FACC15] text-[#FACC15]' : ''
                  }`}
                />
              </button>
            </div>

            {/* Likes count */}
            <p className="text-xs font-bold text-white px-1">
              {currentPost.likesCount} {currentPost.likesCount === 1 ? 'like' : 'likes'}
            </p>

            {/* Quick emoji drawer */}
            {showEmojiPicker && (
              <div className="flex items-center gap-2 p-1.5 bg-zinc-900 rounded-xl overflow-x-auto no-scrollbar">
                {EMOJIS.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setCommentText(prev => prev + em)}
                    className="hover:scale-125 transition-transform"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Comment form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-zinc-400 hover:text-[#FACC15] p-1"
              >
                <Smile className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment to this post..."
                className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-full py-2 px-3 placeholder-zinc-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2 bg-[#FACC15] hover:bg-yellow-400 text-black rounded-full disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EDIT POST CAPTION / PRIVACY MODAL                            */}
      {/* ============================================================ */}
      {isEditing && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white">Edit Post</h3>
              <button onClick={() => setIsEditing(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Caption</label>
                <textarea
                  rows={4}
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-white focus:border-[#FACC15] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Audience Visibility</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditVisibility('public')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                      editVisibility === 'public'
                        ? 'border-[#FACC15] bg-yellow-950/30 text-[#FACC15]'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditVisibility('followers')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                      editVisibility === 'followers'
                        ? 'border-[#FACC15] bg-yellow-950/30 text-[#FACC15]'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Followers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditVisibility('private')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                      editVisibility === 'private'
                        ? 'border-[#FACC15] bg-yellow-950/30 text-[#FACC15]'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Only Me</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-zinc-900 text-zinc-300 rounded-xl hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#FACC15] hover:bg-yellow-400 text-black font-bold rounded-xl"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareOpen && (
        <ShareModal
          post={currentPost}
          isOpen={true}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <ReportModal
          targetId={currentPost.id}
          targetType="post"
          isOpen={true}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
};
