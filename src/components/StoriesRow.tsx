import React, { useRef } from 'react';
import { Story } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Plus } from 'lucide-react';

interface StoriesRowProps {
  stories: Story[];
}

export const StoriesRow: React.FC<StoriesRowProps> = ({ stories }) => {
  const { currentUser } = useAuth();
  const { openStoryViewer, createStory } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group stories by author
  const storyAuthorsMap = new Map<string, Story[]>();
  stories.forEach(s => {
    const list = storyAuthorsMap.get(s.authorId) || [];
    list.push(s);
    storyAuthorsMap.set(s.authorId, list);
  });

  const uniqueAuthors = Array.from(storyAuthorsMap.entries()).map(([_authorId, authorStories]) => {
    const first = authorStories[0];
    const allViewed = authorStories.every(
      s => currentUser && s.viewedBy.includes(currentUser.id)
    );
    return {
      authorId: first.authorId,
      name: first.authorName,
      username: first.authorUsername,
      avatarUrl: first.authorAvatar,
      stories: authorStories,
      allViewed,
    };
  });

  const handleAddStory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          createStory(reader.result, 'image', 'New story on Mehfil ✨');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full bg-zinc-950/60 border-b border-zinc-800/80 py-3 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-lg mx-auto">
        {/* Current User Story / Add Story */}
        {currentUser && (
          <div className="flex flex-col items-center shrink-0 cursor-pointer group">
            <div
              className="relative w-16 h-16 rounded-full p-0.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-[#FACC15] transition-colors">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 p-1 bg-[#FACC15] text-black rounded-full shadow-md group-hover:scale-110 transition-transform">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <span className="text-[11px] text-zinc-300 mt-1 max-w-[64px] truncate font-medium">
              Your story
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAddStory}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
        )}

        {/* Other Creators' Stories */}
        {uniqueAuthors.map(item => (
          <div
            key={item.authorId}
            onClick={() => openStoryViewer(item.stories)}
            className="flex flex-col items-center shrink-0 cursor-pointer group"
          >
            <div
              className={`w-16 h-16 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                item.allViewed
                  ? 'bg-zinc-700'
                  : 'bg-gradient-to-tr from-[#EF4444] via-[#FACC15] to-amber-500 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5">
                <img
                  src={item.avatarUrl}
                  alt={item.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-[11px] text-zinc-300 mt-1 max-w-[64px] truncate">
              {item.username.replace(/_official|_diaries/g, '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
