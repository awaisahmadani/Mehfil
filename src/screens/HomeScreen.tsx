import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { StoriesRow } from '../components/StoriesRow';
import { VideoFeed } from './VideoFeed';
import { PhotoPostCard } from '../components/PhotoPostCard';
import { useData } from '../context/DataContext';
import { Bell, Send, Sparkles, Film, Image as ImageIcon } from 'lucide-react';

interface HomeScreenProps {
  onSelectUser: (userId: string) => void;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectUser,
  onOpenNotifications,
  onOpenMessages,
}) => {
  const { posts, stories, unreadNotificationCount, unreadMessageCount } = useData();
  const [feedMode, setFeedMode] = useState<'reels' | 'feed'>('reels');

  const photoPosts = posts.filter(p => p.type === 'photo');

  return (
    <div className="w-full max-w-lg mx-auto pb-24">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 bg-[#111111]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <Logo size="md" />

        {/* Feed Mode Switcher (TikTok Reels vs Photo Feed) */}
        <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-xl">
          <button
            onClick={() => setFeedMode('reels')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              feedMode === 'reels'
                ? 'bg-[#FACC15] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Reels</span>
          </button>
          <button
            onClick={() => setFeedMode('feed')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              feedMode === 'feed'
                ? 'bg-[#FACC15] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Feed</span>
          </button>
        </div>

        {/* Right Icon Actions: Notifications & Messages */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenMessages}
            className="relative p-2 text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
            title="Direct Messages"
          >
            <Send className="w-5 h-5" />
            {unreadMessageCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FACC15] text-black text-[10px] font-bold flex items-center justify-center">
                {unreadMessageCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Stories Row on top (Instagram Style) */}
      <StoriesRow stories={stories} />

      {/* Main Feed Content Area */}
      <main className="pt-3 px-2">
        {feedMode === 'reels' ? (
          <VideoFeed onSelectUser={onSelectUser} />
        ) : (
          <div className="space-y-4">
            {photoPosts.length === 0 ? (
              <div className="text-center py-16 space-y-2 text-zinc-500 text-xs">
                <Sparkles className="w-8 h-8 mx-auto text-[#FACC15]" />
                <p className="font-semibold text-zinc-300">No photo posts yet</p>
                <p>Tap the + button to upload the first photo!</p>
              </div>
            ) : (
              photoPosts.map(post => (
                <PhotoPostCard
                  key={post.id}
                  post={post}
                  onSelectUser={onSelectUser}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};
