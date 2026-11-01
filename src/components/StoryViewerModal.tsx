import React, { useState, useEffect, useRef } from 'react';
import { Story } from '../types';
import { useData } from '../context/DataContext';
import { X, Heart, Send, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex = 0,
  onClose,
}) => {
  const { viewStory, sendMessage, openOrCreateConversationWithUser } = useData();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentStory = stories[currentIndex];
  const STORY_DURATION = 6000; // 6 seconds per story

  useEffect(() => {
    if (currentStory) {
      viewStory(currentStory.id);
      setProgress(0);
      setLiked(false);
    }
  }, [currentIndex, currentStory]);

  useEffect(() => {
    if (isPaused || !currentStory) return;

    const interval = 50; // update progress every 50ms
    const step = (interval / STORY_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(i => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, stories.length]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setProgress(0);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentStory) return;

    // Send as message in DM
    const authorUser = {
      id: currentStory.authorId,
      name: currentStory.authorName,
      username: currentStory.authorUsername,
      email: `${currentStory.authorUsername}@mehfil.app`,
      avatarUrl: currentStory.authorAvatar,
      bio: '',
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: '',
      blockedUsers: [],
      savedPosts: [],
      followers: [],
      following: [],
      pendingFollowRequests: [],
    };

    const conv = openOrCreateConversationWithUser(authorUser);
    sendMessage(conv.id, `Replied to story: "${replyText.trim()}"`);
    setReplyText('');
    setToastMessage('Reply sent to direct message! ✨');
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-md select-none">
      {/* Toast banner */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#FACC15] text-black font-semibold text-xs px-4 py-2 rounded-full z-50 shadow-lg animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Desktop navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 z-40 p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-8 z-40 p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Story Phone Mockup Frame */}
      <div
        className="relative w-full h-full md:max-w-md md:h-[90vh] md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story Media Background */}
        <div className="absolute inset-0 z-0 bg-black">
          <img
            src={currentStory.mediaUrl}
            alt="Story content"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Tap zones for Mobile (left tap = prev, right tap = next) */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
        </div>

        {/* Top Header & Progress Bars */}
        <div className="relative z-20 p-4 pt-6 md:pt-4 space-y-3">
          {/* Progress bar indicators */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((s, idx) => (
              <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{
                    width:
                      idx === currentIndex
                        ? `${progress}%`
                        : idx < currentIndex
                        ? '100%'
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author info & Close */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <img
                src={currentStory.authorAvatar}
                alt={currentStory.authorName}
                className="w-9 h-9 rounded-full object-cover border-2 border-[#FACC15]"
              />
              <div>
                <p className="text-xs font-bold leading-none">{currentStory.authorUsername}</p>
                <p className="text-[10px] text-zinc-300 mt-0.5">3h ago</p>
              </div>
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 bg-black/40 hover:bg-black/70 rounded-full text-white/90 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="relative z-20 px-4 text-center">
            <span className="inline-block bg-black/60 backdrop-blur-md text-white text-sm px-4 py-2 rounded-2xl max-w-[90%]">
              {currentStory.caption}
            </span>
          </div>
        )}

        {/* Bottom Reply Bar */}
        <div className="relative z-20 p-4 pb-6 md:pb-4">
          <form
            onSubmit={handleSendReply}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentStory.authorUsername}...`}
              className="flex-1 bg-black/50 border border-white/20 focus:border-[#FACC15] focus:outline-none rounded-full px-4 py-2.5 text-xs text-white placeholder-white/70 backdrop-blur-md"
            />
            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                liked ? 'bg-[#EF4444] text-white' : 'bg-black/50 text-white hover:text-[#EF4444]'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </button>
            {replyText.trim() && (
              <button
                type="submit"
                className="p-2.5 bg-[#FACC15] text-black rounded-full hover:bg-yellow-400 transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
