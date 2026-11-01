import React, { useState } from 'react';
import { User, FollowListItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  X,
  Search,
  UserCheck,
  UserPlus,
  Lock,
  UserX,
  Check,
} from 'lucide-react';

interface FollowListModalProps {
  targetUser: User;
  initialTab?: 'followers' | 'following';
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  targetUser,
  initialTab = 'followers',
  onClose,
  onSelectUser,
}) => {
  const { currentUser, users } = useAuth();
  const { followUser, unfollowUser, removeFollower } = useData();

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [removedUserIds, setRemovedUserIds] = useState<string[]>([]);

  const isOwner = currentUser && currentUser.id === targetUser.id;
  const isApprovedFollower = currentUser && targetUser.followers?.includes(currentUser.id);
  const isLocked = targetUser.isPrivate && !isOwner && !isApprovedFollower;

  // Resolve users from IDs in targetUser.followers and targetUser.following
  const followerUserObjects: User[] = (targetUser.followers || [])
    .map(id => users.find(u => u.id === id))
    .filter((u): u is User => u !== undefined && !removedUserIds.includes(u.id));

  const followingUserObjects: User[] = (targetUser.following || [])
    .map(id => users.find(u => u.id === id))
    .filter((u): u is User => u !== undefined);

  const currentList = activeTab === 'followers' ? followerUserObjects : followingUserObjects;

  const filteredList = currentList.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  const handleRemoveFollower = (followerId: string) => {
    removeFollower(targetUser.id, followerId);
    setRemovedUserIds(prev => [...prev, followerId]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[580px] max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>@{targetUser.username}</span>
            {targetUser.isPrivate && <Lock className="w-3.5 h-3.5 text-zinc-400" />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Lock Guard */}
        {isLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#FACC15]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">This account is private</h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              Follow @{targetUser.username} to see their followers and who they follow.
            </p>
          </div>
        ) : (
          <>
            {/* Tabs (Followers vs Following) */}
            <div className="flex items-center border-b border-zinc-800 text-xs">
              <button
                onClick={() => {
                  setActiveTab('followers');
                  setSearchQuery('');
                }}
                className={`flex-1 py-3 font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'followers'
                    ? 'border-[#FACC15] text-[#FACC15]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <span>Followers</span>
                <span className="text-[11px] px-1.5 py-0.2 bg-zinc-900 rounded-full font-mono">
                  {followerUserObjects.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('following');
                  setSearchQuery('');
                }}
                className={`flex-1 py-3 font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'following'
                    ? 'border-[#FACC15] text-[#FACC15]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <span>Following</span>
                <span className="text-[11px] px-1.5 py-0.2 bg-zinc-900 rounded-full font-mono">
                  {followingUserObjects.length}
                </span>
              </button>
            </div>

            {/* Search Filter Inside List */}
            <div className="p-3 border-b border-zinc-900">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-xl py-2 pl-9 pr-3 placeholder-zinc-500"
                />
              </div>
            </div>

            {/* User List Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  {searchQuery ? 'No matching users found.' : `No ${activeTab} yet.`}
                </div>
              ) : (
                filteredList.map(u => {
                  const isViewer = currentUser && currentUser.id === u.id;
                  const isFollowingThisUser = currentUser?.following?.includes(u.id);
                  const isRequested = u.pendingFollowRequests?.includes(currentUser?.id || '');

                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-zinc-900/80 transition-colors"
                    >
                      <div
                        onClick={() => {
                          onSelectUser(u.id);
                          onClose();
                        }}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 mr-2"
                      >
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div className="text-xs truncate">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white hover:underline truncate">
                              {u.name}
                            </span>
                            {u.isPrivate && <Lock className="w-3 h-3 text-zinc-400 shrink-0" />}
                          </div>
                          <p className="text-zinc-400 text-[11px]">@{u.username}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Remove follower option for profile owner viewing their followers list */}
                        {isOwner && activeTab === 'followers' && !isViewer && (
                          <button
                            onClick={() => handleRemoveFollower(u.id)}
                            className="bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-[#EF4444] border border-zinc-800 hover:border-red-900 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Remove follower"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}

                        {/* Follow / Following / Requested button for viewer */}
                        {!isViewer && currentUser && (
                          <button
                            onClick={() => {
                              if (isFollowingThisUser) {
                                unfollowUser(u.id);
                              } else {
                                followUser(u.id);
                              }
                            }}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                              isFollowingThisUser
                                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                : isRequested
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-[#FACC15] hover:bg-yellow-400 text-black'
                            }`}
                          >
                            {isFollowingThisUser ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Following
                              </>
                            ) : isRequested ? (
                              'Requested'
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                {u.isPrivate ? 'Request' : 'Follow'}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
