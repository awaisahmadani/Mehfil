import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { TRENDING_TAGS } from '../data/mockData';
import { Search, Hash, Heart, Play, UserCheck, UserPlus, Lock } from 'lucide-react';

interface SearchScreenProps {
  onSelectUser: (userId: string) => void;
  onSelectPost?: (postId: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectUser }) => {
  const { users, currentUser } = useAuth();
  const { posts, followUser, unfollowUser, setActivePostId } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'accounts' | 'tags' | 'posts'>('all');

  const cleanQuery = searchTerm.trim().toLowerCase().replace(/^#|^@/, '');

  // Filter users
  const filteredUsers = users.filter(u => {
    if (!cleanQuery) return true;
    return (
      u.name.toLowerCase().includes(cleanQuery) ||
      u.username.toLowerCase().includes(cleanQuery) ||
      u.bio.toLowerCase().includes(cleanQuery)
    );
  });

  // Filter posts
  const filteredPosts = posts.filter(p => {
    if (!cleanQuery) return true;
    return (
      p.caption.toLowerCase().includes(cleanQuery) ||
      p.hashtags.some(tag => tag.toLowerCase().includes(cleanQuery)) ||
      p.authorName.toLowerCase().includes(cleanQuery) ||
      p.authorUsername.toLowerCase().includes(cleanQuery)
    );
  });

  // Filter hashtags
  const filteredTags = TRENDING_TAGS.filter(t =>
    cleanQuery ? t.tag.toLowerCase().includes(cleanQuery) : true
  );

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search creators, #hashtags, or posts..."
          className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-2xl py-2.5 pl-10 pr-4 placeholder-zinc-500 transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto no-scrollbar text-xs">
        {(['all', 'accounts', 'tags', 'posts'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-full font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'bg-[#FACC15] text-black shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Trending Hashtags row when query is empty or on 'tags' */}
      {(activeTab === 'all' || activeTab === 'tags') && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
            <Hash className="w-4 h-4 text-[#FACC15]" />
            Trending on Mehfil
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredTags.map(tagItem => (
              <button
                key={tagItem.tag}
                onClick={() => {
                  setSearchTerm(tagItem.tag);
                  setActiveTab('posts');
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-xl text-left transition-all text-xs group"
              >
                <p className="font-bold text-[#FACC15] group-hover:underline">{tagItem.tag}</p>
                <p className="text-[10px] text-zinc-500">{tagItem.count}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Accounts List */}
      {(activeTab === 'all' || activeTab === 'accounts') && (
        <div className="space-y-3 pt-1">
          <p className="text-xs font-bold text-zinc-300">
            {searchTerm ? 'Creators matching search' : 'Suggested Creators'}
          </p>
          <div className="space-y-2">
            {filteredUsers.slice(0, activeTab === 'accounts' ? 10 : 4).map(u => {
              const isFollowing = currentUser?.following?.includes(u.id);
              const isSelf = currentUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div
                    onClick={() => onSelectUser(u.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 mr-2"
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                    <div className="text-xs truncate">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white hover:underline truncate">
                          {u.name}
                        </span>
                        {u.isPrivate && <Lock className="w-3 h-3 text-zinc-400" />}
                      </div>
                      <p className="text-zinc-400 text-[11px]">@{u.username}</p>
                      <p className="text-zinc-500 text-[10px] truncate max-w-[200px] mt-0.5">
                        {u.bio || 'Mehfil member'}
                      </p>
                    </div>
                  </div>

                  {!isSelf && currentUser && (
                    <button
                      onClick={() => (isFollowing ? unfollowUser(u.id) : followUser(u.id))}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1 ${
                        isFollowing
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-[#FACC15] hover:bg-yellow-400 text-black'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explore Grid (Instagram Explore Style) */}
      {(activeTab === 'all' || activeTab === 'posts') && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-zinc-300">
            {searchTerm ? 'Posts matching search' : 'Explore Grid'}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {filteredPosts.map(post => (
              <div
                key={post.id}
                onClick={() => setActivePostId(post.id, filteredPosts)}
                className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 group cursor-pointer hover:border hover:border-[#FACC15]/40 transition-colors"
              >
                <img
                  src={post.thumbnailUrl || post.mediaUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Video indicator icon */}
                {post.type === 'video' && (
                  <div className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-md text-white">
                    <Play className="w-3 h-3 fill-white" />
                  </div>
                )}

                {/* Hover overlay with likes count */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-bold transition-opacity">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-[#EF4444] text-[#EF4444]" />
                    <span>{post.likesCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
