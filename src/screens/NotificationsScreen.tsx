import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Check,
  X,
  Lock,
} from 'lucide-react';

interface NotificationsScreenProps {
  onSelectUser: (userId: string) => void;
  onSelectPost?: (postId: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onSelectUser,
}) => {
  const { currentUser } = useAuth();
  const {
    notifications,
    markNotificationsAsRead,
    acceptFollowRequest,
    rejectFollowRequest,
    followUser,
    setActivePostId,
  } = useData();

  const [filterTab, setFilterTab] = useState<'all' | 'requests'>('all');

  const followRequests = notifications.filter(
    n => n.type === 'follow_request' && n.recipientId === currentUser?.id
  );

  const filteredNotifs = notifications.filter(n => {
    if (filterTab === 'requests') {
      return n.type === 'follow_request';
    }
    return true;
  });

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#FACC15]" />
          <h2 className="text-xl font-bold text-white">Notifications</h2>
        </div>
        <button
          onClick={markNotificationsAsRead}
          className="text-xs text-zinc-400 hover:text-[#FACC15] font-medium"
        >
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
            filterTab === 'all'
              ? 'bg-[#FACC15] text-black shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilterTab('requests')}
          className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
            filterTab === 'requests'
              ? 'bg-[#FACC15] text-black shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Follow Requests
          {followRequests.some(r => r.requestStatus === 'pending') && (
            <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block animate-pulse" />
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifs.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No notifications in this category.
          </div>
        ) : (
          filteredNotifs.map(notif => {
            const isFollowRequest = notif.type === 'follow_request';
            const isFollowingSender = currentUser?.following?.includes(notif.senderId);

            return (
              <div
                key={notif.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  !notif.read
                    ? 'bg-zinc-900/80 border-[#FACC15]/30 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 mr-3">
                  {/* Sender Avatar & Type Icon */}
                  <div className="relative shrink-0 cursor-pointer" onClick={() => onSelectUser(notif.senderId)}>
                    <img
                      src={notif.senderAvatar}
                      alt={notif.senderName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white text-[10px] ${
                        notif.type === 'like'
                          ? 'bg-[#EF4444]'
                          : notif.type === 'comment'
                          ? 'bg-sky-500'
                          : notif.type === 'follow_request'
                          ? 'bg-amber-500'
                          : 'bg-[#FACC15] text-black'
                      }`}
                    >
                      {notif.type === 'like' && <Heart className="w-2.5 h-2.5 fill-current" />}
                      {notif.type === 'comment' && <MessageCircle className="w-2.5 h-2.5 fill-current" />}
                      {notif.type === 'follow' && <UserCheck className="w-2.5 h-2.5" />}
                      {notif.type === 'follow_request' && <Lock className="w-2.5 h-2.5" />}
                    </span>
                  </div>

                  {/* Message body */}
                  <div className="text-xs">
                    <p className="leading-snug">
                      <span
                        onClick={() => onSelectUser(notif.senderId)}
                        className="font-bold text-white hover:underline cursor-pointer"
                      >
                        {notif.senderName}
                      </span>{' '}
                      <span className="text-zinc-300">{notif.message}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{notif.createdAt}</p>
                  </div>
                </div>

                {/* Right Action: Accept/Reject if Follow Request; Target Post Thumbnail if Like/Comment */}
                {isFollowRequest ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {notif.requestStatus === 'pending' ? (
                      <>
                        <button
                          onClick={() => acceptFollowRequest(notif.id, notif.senderId)}
                          className="bg-[#FACC15] hover:bg-yellow-400 text-black font-bold p-1.5 px-3 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => rejectFollowRequest(notif.id, notif.senderId)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded-xl transition-colors"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : notif.requestStatus === 'accepted' ? (
                      <span className="text-[11px] font-semibold text-emerald-400">Accepted</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-zinc-500">Declined</span>
                    )}
                  </div>
                ) : notif.targetPostThumbnail ? (
                  <img
                    src={notif.targetPostThumbnail}
                    alt="Post"
                    onClick={() => notif.targetPostId && setActivePostId(notif.targetPostId)}
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-zinc-800 cursor-pointer hover:border-[#FACC15] hover:scale-105 transition-all"
                    title="View post"
                  />
                ) : notif.type === 'follow' && !isFollowingSender ? (
                  <button
                    onClick={() => followUser(notif.senderId)}
                    className="bg-zinc-800 hover:bg-[#FACC15] hover:text-black text-white text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Follow
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
