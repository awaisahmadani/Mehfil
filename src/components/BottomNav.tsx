import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Home,
  Search,
  Plus,
  Send,
  User as UserIcon,
} from 'lucide-react';

export type TabType = 'home' | 'search' | 'upload' | 'messages' | 'profile';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const { currentUser } = useAuth();
  const { unreadMessageCount } = useData();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#111111]/95 border-t border-zinc-800/90 backdrop-blur-lg">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center p-2 transition-all ${
            currentTab === 'home' ? 'text-[#FACC15] scale-105' : 'text-zinc-400 hover:text-white'
          }`}
          title="Home Feed"
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] mt-0.5 font-semibold">Home</span>
        </button>

        {/* Search */}
        <button
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center justify-center p-2 transition-all ${
            currentTab === 'search' ? 'text-[#FACC15] scale-105' : 'text-zinc-400 hover:text-white'
          }`}
          title="Explore & Search"
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] mt-0.5 font-semibold">Search</span>
        </button>

        {/* Upload (+) Center Button */}
        <button
          onClick={() => onTabChange('upload')}
          className="relative -top-2 flex flex-col items-center group"
          title="Create Post / Reel"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#EF4444] via-[#FACC15] to-amber-400 p-0.5 shadow-[0_4px_16px_rgba(250,204,21,0.35)] group-hover:scale-110 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-[#FACC15]">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-zinc-300 group-hover:text-[#FACC15]">
            Create
          </span>
        </button>

        {/* Messages */}
        <button
          onClick={() => onTabChange('messages')}
          className={`relative flex flex-col items-center justify-center p-2 transition-all ${
            currentTab === 'messages' ? 'text-[#FACC15] scale-105' : 'text-zinc-400 hover:text-white'
          }`}
          title="Direct Messages"
        >
          <Send className="w-6 h-6" />
          {unreadMessageCount > 0 && (
            <span className="absolute top-1.5 right-2 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadMessageCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5 font-semibold">Chat</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center p-2 transition-all ${
            currentTab === 'profile' ? 'text-[#FACC15] scale-105' : 'text-zinc-400 hover:text-white'
          }`}
          title="Your Profile"
        >
          {currentUser ? (
            <div
              className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-colors ${
                currentTab === 'profile' ? 'border-[#FACC15]' : 'border-zinc-600'
              }`}
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <UserIcon className="w-6 h-6" />
          )}
          <span className="text-[10px] mt-0.5 font-semibold">Profile</span>
        </button>
      </div>
    </nav>
  );
};
