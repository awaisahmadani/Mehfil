import React, { useState, useRef, useEffect } from 'react';
import { Post } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CommentsSheet } from '../components/CommentsSheet';
import { ShareModal } from '../components/ShareModal';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Music,
  Plus,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface VideoFeedProps {
  onSelectUser?: (userId: string) => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ onSelectUser }) => {
  const { posts, toggleLikePost, toggleSavePost, followUser } = useData();
  const { currentUser } = useAuth();

  const videoPosts = posts.filter(p => p.type === 'video');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [activeCommentsPost, setActiveCommentsPost] = useState<Post | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<Post | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentPost = videoPosts[currentIndex] || videoPosts[0];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < videoPosts.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const handleDoubleTap = () => {
    if (currentPost) {
      toggleLikePost(currentPost.id);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  if (!currentPost) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 space-y-3">
        <Sparkles className="w-10 h-10 text-[#FACC15]" />
        <h3 className="font-bold text-white text-lg">No video reels yet</h3>
        <p className="text-zinc-400 text-xs">Be the first to post a TikTok reel on Mehfil!</p>
      </div>
    );
  }

  const isLiked = currentUser && currentPost.likedBy?.includes(currentUser.id);
  const isSaved = currentUser && (currentPost.savedBy?.includes(currentUser.id) || currentUser.savedPosts?.includes(currentPost.id));
  const isFollowing = currentUser && (currentUser.following?.includes(currentPost.authorId) || currentPost.authorId === currentUser.id);

  return (
    <div className="relative w-full max-w-md mx-auto h-[78vh] sm:h-[82vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 flex items-center justify-center select-none">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentPost.mediaUrl}
        poster={currentPost.thumbnailUrl}
        loop
        playsInline
        muted={isMuted}
        onClick={handleDoubleTap}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Subtle top and bottom gradients for text readability */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

      {/* Floating double-tap heart burst animation */}
      {showHeartAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="w-28 h-28 text-[#EF4444] fill-[#EF4444] animate-heart-burst drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
        </div>
      )}

      {/* Sound / Volume Toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-zinc-300" /> : <Volume2 className="w-4 h-4 text-[#FACC15]" />}
      </button>

      {/* Desktop Navigation Arrow Buttons */}
      <div className="hidden sm:flex flex-col gap-2 absolute right-[-52px] top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 bg-zinc-900 border border-zinc-700 text-white rounded-full hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Previous Video"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === videoPosts.length - 1}
          className="p-3 bg-zinc-900 border border-zinc-700 text-white rounded-full hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Next Video"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Right Action Bar (TikTok / Reels Style) */}
      <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center space-y-4">
        {/* Creator Avatar with follow button */}
        <div className="relative mb-2">
          <div
            onClick={() => onSelectUser && onSelectUser(currentPost.authorId)}
            className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#EF4444] to-[#FACC15] cursor-pointer"
          >
            <img
              src={currentPost.authorAvatar}
              alt={currentPost.authorName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {!isFollowing && currentUser && (
            <button
              onClick={() => followUser(currentPost.authorId)}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#EF4444] hover:bg-red-600 text-white p-0.5 rounded-full shadow-md transition-transform hover:scale-110"
              title="Follow"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={() => {
            toggleLikePost(currentPost.id);
            if (!isLiked) {
              setShowHeartAnimation(true);
              setTimeout(() => setShowHeartAnimation(false), 800);
            }
          }}
          className="flex flex-col items-center group"
        >
          <div
            className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-75 ${
              isLiked ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-black/40 text-white group-hover:text-red-400'
            }`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow mt-1">
            {currentPost.likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => setActiveCommentsPost(currentPost)}
          className="flex flex-col items-center group"
        >
          <div className="p-2.5 bg-black/40 group-hover:bg-black/60 rounded-full backdrop-blur-md text-white transition-all">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow mt-1">
            {currentPost.commentsCount || currentPost.comments?.length || 0}
          </span>
        </button>

        {/* Save / Bookmark Button */}
        <button
          onClick={() => toggleSavePost(currentPost.id)}
          className="flex flex-col items-center group"
        >
          <div
            className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
              isSaved ? 'bg-[#FACC15]/20 text-[#FACC15]' : 'bg-black/40 text-white group-hover:text-yellow-400'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow mt-1">
            Save
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => setActiveSharePost(currentPost)}
          className="flex flex-col items-center group"
        >
          <div className="p-2.5 bg-black/40 group-hover:bg-black/60 rounded-full backdrop-blur-md text-white transition-all">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow mt-1">
            {currentPost.sharesCount}
          </span>
        </button>

        {/* Spinning Vinyl Music Disc */}
        <div className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center animate-spin-slow shadow-lg">
          <div className="w-3.5 h-3.5 rounded-full bg-[#EF4444] border border-white" />
        </div>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute left-4 right-20 bottom-5 z-20 text-left space-y-2 pointer-events-auto">
        <div
          onClick={() => onSelectUser && onSelectUser(currentPost.authorId)}
          className="cursor-pointer inline-flex items-center gap-1.5"
        >
          <span className="font-bold text-sm text-white drop-shadow-md hover:underline">
            @{currentPost.authorUsername}
          </span>
          <span className="text-[10px] bg-[#EF4444] text-white px-1.5 py-0.2 rounded-full font-bold">
            Creator
          </span>
        </div>

        <p className="text-xs text-zinc-100 line-clamp-2 leading-relaxed drop-shadow">
          {currentPost.caption}
        </p>

        {/* Hashtags */}
        {currentPost.hashtags && currentPost.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-[11px] text-[#FACC15] font-semibold">
            {currentPost.hashtags.map((tag, i) => (
              <span key={i} className="hover:underline cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Audio Track */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
          <Music className="w-3.5 h-3.5 text-[#FACC15]" />
          <span className="truncate max-w-[200px]">
            {currentPost.musicTitle || `Original Sound • @${currentPost.authorUsername}`}
          </span>
        </div>
      </div>

      {/* Comments Sheet Modal */}
      {activeCommentsPost && (
        <CommentsSheet
          post={activeCommentsPost}
          isOpen={true}
          onClose={() => setActiveCommentsPost(null)}
        />
      )}

      {/* Share Modal */}
      {activeSharePost && (
        <ShareModal
          post={activeSharePost}
          isOpen={true}
          onClose={() => setActiveSharePost(null)}
        />
      )}
    </div>
  );
};
