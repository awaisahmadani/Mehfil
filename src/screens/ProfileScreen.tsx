import React, { useState, useRef } from 'react';
import { User, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { FollowListModal } from '../components/FollowListModal';
import {
  Grid,
  Video,
  Bookmark,
  Lock,
  Edit3,
  Settings,
  Share2,
  UserCheck,
  UserPlus,
  Send,
  Link as LinkIcon,
  Play,
  Camera,
  X,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';

interface ProfileScreenProps {
  userId?: string; // If undefined, displays currentUser
  onOpenSettings?: () => void;
  onOpenMessagesWithUser?: (user: User) => void;
  onSelectUser?: (userId: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userId,
  onOpenSettings,
  onOpenMessagesWithUser,
  onSelectUser,
}) => {
  const { currentUser, users, updateProfile, blockUser } = useAuth();
  const {
    posts,
    followUser,
    unfollowUser,
    openOrCreateConversationWithUser,
    setActivePostId,
  } = useData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine which user profile to show
  const profileUser: User | undefined = userId
    ? users.find(u => u.id === userId)
    : currentUser || undefined;

  const isOwner = currentUser && profileUser && currentUser.id === profileUser.id;
  const isFollowing = currentUser && profileUser && currentUser.following?.includes(profileUser.id);
  const isRequested =
    profileUser &&
    profileUser.pendingFollowRequests?.includes(currentUser?.id || '');

  // Privacy Rule: if private and not following and not owner -> hidden
  const isPrivateLocked = profileUser?.isPrivate && !isOwner && !isFollowing;

  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'saved'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profileUser?.name || '');
  const [editBio, setEditBio] = useState(profileUser?.bio || '');
  const [editLink, setEditLink] = useState(profileUser?.link || '');
  const [editAvatar, setEditAvatar] = useState(profileUser?.avatarUrl || '');
  const [copiedShare, setCopiedShare] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  // BUG 2: Follow list modal state
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following' | null>(null);

  if (!profileUser) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <p>User profile not found.</p>
      </div>
    );
  }

  // Filter posts
  const userPosts = posts.filter(p => p.authorId === profileUser.id);
  const userVideos = userPosts.filter(p => p.type === 'video');
  const savedPosts = posts.filter(p => currentUser?.savedPosts?.includes(p.id));

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim(),
      bio: editBio.slice(0, 150),
      link: editLink.trim(),
      avatarUrl: editAvatar,
    });
    setIsEditing(false);
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#@${profileUser.username}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleMessageUser = () => {
    if (onOpenMessagesWithUser) {
      onOpenMessagesWithUser(profileUser);
    } else {
      openOrCreateConversationWithUser(profileUser);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base text-white">@{profileUser.username}</span>
          {profileUser.isPrivate && <Lock className="w-3.5 h-3.5 text-zinc-400" />}
          {profileUser.isVerified && (
            <CheckCircle2 className="w-4 h-4 text-[#FACC15] fill-[#FACC15]/20" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <button
              onClick={onOpenSettings}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setOptionsOpen(!optionsOpen)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {optionsOpen && (
                <div
                  className="absolute right-0 top-9 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1 z-30 text-xs"
                  onClick={() => setOptionsOpen(false)}
                >
                  <button
                    onClick={() => blockUser(profileUser.id)}
                    className="w-full px-3 py-2 text-left text-[#EF4444] hover:bg-zinc-800"
                  >
                    Block User
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Header (DP & Counts) */}
      <div className="flex items-center justify-between gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 bg-gradient-to-tr from-[#EF4444] via-[#FACC15] to-amber-500 shrink-0">
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.name}
              className="w-full h-full rounded-full object-cover bg-black"
            />
          </div>
        </div>

        {/* Stats Counts (Clickable Followers & Following - BUG 2) */}
        <div className="flex-1 flex items-center justify-around text-center select-none">
          {/* Posts Count */}
          <div className="px-2 py-1">
            <p className="font-extrabold text-base sm:text-lg text-white">
              {profileUser.postsCount || userPosts.length}
            </p>
            <p className="text-[11px] text-zinc-400">Posts</p>
          </div>

          {/* Followers Clickable Button */}
          <button
            type="button"
            onClick={() => setFollowModalTab('followers')}
            className="px-2 py-1 rounded-xl hover:bg-zinc-900 transition-colors text-center group cursor-pointer"
          >
            <p className="font-extrabold text-base sm:text-lg text-white group-hover:text-[#FACC15] transition-colors">
              {profileUser.followersCount}
            </p>
            <p className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Followers
            </p>
          </button>

          {/* Following Clickable Button */}
          <button
            type="button"
            onClick={() => setFollowModalTab('following')}
            className="px-2 py-1 rounded-xl hover:bg-zinc-900 transition-colors text-center group cursor-pointer"
          >
            <p className="font-extrabold text-base sm:text-lg text-white group-hover:text-[#FACC15] transition-colors">
              {profileUser.followingCount}
            </p>
            <p className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Following
            </p>
          </button>
        </div>
      </div>

      {/* Name, Bio, Links */}
      <div className="space-y-1.5 text-xs">
        <p className="font-bold text-sm text-white">{profileUser.name}</p>
        {profileUser.bio ? (
          <p className="text-zinc-300 whitespace-pre-line leading-relaxed">{profileUser.bio}</p>
        ) : (
          <p className="text-zinc-500 italic">No bio added yet.</p>
        )}

        {profileUser.link && (
          <a
            href={profileUser.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#FACC15] hover:underline font-medium pt-0.5"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="truncate max-w-xs">{profileUser.link.replace(/^https?:\/\//, '')}</span>
          </a>
        )}
      </div>

      {/* Profile Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {isOwner ? (
          <>
            <button
              onClick={() => {
                setEditName(profileUser.name);
                setEditBio(profileUser.bio || '');
                setEditLink(profileUser.link || '');
                setEditAvatar(profileUser.avatarUrl);
                setIsEditing(true);
              }}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2 px-3 rounded-xl border border-zinc-700 text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#FACC15]" />
              Edit Profile
            </button>
            <button
              onClick={handleShareProfile}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold py-2 px-3 rounded-xl border border-zinc-700 text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedShare ? 'Copied!' : 'Share Profile'}
            </button>
          </>
        ) : (
          <>
            {/* Follow / Following / Requested button */}
            <button
              onClick={() => {
                if (isFollowing) {
                  unfollowUser(profileUser.id);
                } else {
                  followUser(profileUser.id);
                }
              }}
              className={`flex-1 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${
                isFollowing
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : isRequested
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-[#FACC15] hover:bg-yellow-400 text-black shadow-md shadow-yellow-500/10'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Following
                </>
              ) : isRequested ? (
                'Requested'
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  {profileUser.isPrivate ? 'Request Follow' : 'Follow'}
                </>
              )}
            </button>

            {/* Message button */}
            <button
              onClick={handleMessageUser}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2 px-3 rounded-xl border border-zinc-700 text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-[#FACC15]" />
              Message
            </button>
          </>
        )}
      </div>

      {/* Privacy lock guard for private non-mutual accounts */}
      {isPrivateLocked ? (
        <div className="border border-zinc-800 rounded-3xl p-8 text-center space-y-3 bg-zinc-950/80 my-6">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Lock className="w-6 h-6 text-[#FACC15]" />
          </div>
          <h3 className="font-bold text-white text-base">This account is private</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Follow this account to see their photos, reels, and stories.
          </p>
        </div>
      ) : (
        <>
          {/* Profile Navigation Tabs (Posts, Videos, Saved) */}
          <div className="flex items-center border-t border-zinc-800 pt-2 text-xs">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'posts'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              Posts
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'videos'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              Reels
            </button>

            {isOwner && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'saved'
                    ? 'border-[#FACC15] text-[#FACC15]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Saved
              </button>
            )}
          </div>

          {/* Posts Grid Display (BUG 1: Clickable to open full post) */}
          {activeTab === 'posts' && (
            <div className="grid grid-cols-3 gap-1.5">
              {userPosts.length === 0 ? (
                <div className="col-span-3 py-12 text-center text-zinc-500 text-xs">
                  No posts yet.
                </div>
              ) : (
                userPosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => setActivePostId(post.id, userPosts)}
                    className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden group cursor-pointer border border-zinc-800/40 hover:border-[#FACC15]/40 transition-colors"
                  >
                    <img
                      src={post.thumbnailUrl || post.mediaUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {post.type === 'video' && (
                      <div className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded text-white">
                        <Play className="w-3 h-3 fill-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                      <span>{post.likesCount} ❤️</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Videos Tab (BUG 1: Clickable to open video reel) */}
          {activeTab === 'videos' && (
            <div className="grid grid-cols-3 gap-1.5">
              {userVideos.length === 0 ? (
                <div className="col-span-3 py-12 text-center text-zinc-500 text-xs">
                  No video reels uploaded yet.
                </div>
              ) : (
                userVideos.map(post => (
                  <div
                    key={post.id}
                    onClick={() => setActivePostId(post.id, userVideos)}
                    className="relative aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden group cursor-pointer border border-zinc-800/40 hover:border-[#FACC15]/40 transition-colors"
                  >
                    <img
                      src={post.thumbnailUrl || post.mediaUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] text-white font-bold bg-black/50 px-1.5 py-0.5 rounded">
                      <Play className="w-2.5 h-2.5 fill-white" />
                      {post.likesCount}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Saved Tab (BUG 1: Clickable to open saved post) */}
          {activeTab === 'saved' && isOwner && (
            <div className="grid grid-cols-3 gap-1.5">
              {savedPosts.length === 0 ? (
                <div className="col-span-3 py-12 text-center text-zinc-500 text-xs">
                  No saved posts. Save posts to view them here privately.
                </div>
              ) : (
                savedPosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => setActivePostId(post.id, savedPosts)}
                    className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden group cursor-pointer border border-zinc-800/40 hover:border-[#FACC15]/40 transition-colors"
                  >
                    <img
                      src={post.thumbnailUrl || post.mediaUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* BUG 2: Followers / Following List Modal */}
      {followModalTab && (
        <FollowListModal
          targetUser={profileUser}
          initialTab={followModalTab}
          onClose={() => setFollowModalTab(null)}
          onSelectUser={uid => {
            setFollowModalTab(null);
            if (onSelectUser) onSelectUser(uid);
          }}
        />
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* DP Change */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={editAvatar}
                    alt="Edit preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#FACC15]"
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFile}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#FACC15] font-semibold hover:underline"
                >
                  Change Profile Photo
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-xl py-2.5 px-3"
                />
              </div>

              {/* Bio */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Bio</label>
                  <span className="text-[10px] text-zinc-500">{editBio.length}/150</span>
                </div>
                <textarea
                  maxLength={150}
                  rows={3}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-xl p-3 resize-none"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Website Link</label>
                <input
                  type="url"
                  value={editLink}
                  onChange={e => setEditLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-xl py-2.5 px-3"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold py-2.5 px-4 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FACC15] hover:bg-yellow-400 text-black font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-yellow-500/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
