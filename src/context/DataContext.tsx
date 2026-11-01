import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Post, Comment, Story, Conversation, Message, NotificationItem, User } from '../types';
import {
  INITIAL_POSTS,
  INITIAL_STORIES,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { useAuth } from './AuthContext';

// Helper to generate consistent sorted chatId: e.g. "uid1_uid2"
export const getDeterministicChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

interface DataContextType {
  posts: Post[];
  stories: Story[];
  conversations: Conversation[];
  notifications: NotificationItem[];
  activeConversation: Conversation | null;
  activePostId: string | null;
  activePostList: Post[];
  activeStoryIndex: number | null;
  activeStoryUserStories: Story[];
  unreadNotificationCount: number;
  unreadMessageCount: number;
  isTypingUserId: string | null;
  // Post Interactions (BUG 1)
  setActivePostId: (postId: string | null, list?: Post[]) => void;
  getPostById: (postId: string) => Post | undefined;
  editPost: (postId: string, updates: { caption?: string; visibility?: 'public' | 'followers' | 'private' }) => void;
  deletePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  addComment: (postId: string, text: string, replyToCommentId?: string) => void;
  likeComment: (postId: string, commentId: string) => void;
  createPost: (postData: {
    type: 'photo' | 'video';
    mediaUrl: string;
    caption: string;
    hashtags: string[];
    visibility: 'public' | 'followers' | 'private';
    musicTitle?: string;
  }) => void;
  // Follow / Unfollow / Remove Follower (BUG 2)
  followUser: (targetUserId: string) => void;
  unfollowUser: (targetUserId: string) => void;
  removeFollower: (userId: string, followerId: string) => void;
  acceptFollowRequest: (notificationId: string, requesterId: string) => void;
  rejectFollowRequest: (notificationId: string, requesterId: string) => void;
  // Real-time Chat System (BUG 3)
  setActiveConversation: (conv: Conversation | null) => void;
  openOrCreateConversationWithUser: (user: User) => Conversation;
  getMessagesForChat: (chatId: string) => Message[];
  sendMessage: (chatId: string, text: string, mediaUrl?: string) => void;
  deleteMessage: (chatId: string, messageId: string, scope: 'me' | 'everyone') => void;
  markConversationSeen: (chatId: string) => void;
  acceptMessageRequest: (chatId: string) => void;
  // Stories & Viewer
  createStory: (mediaUrl: string, type: 'image' | 'video', caption?: string) => void;
  viewStory: (storyId: string) => void;
  openStoryViewer: (stories: Story[], startIndex?: number) => void;
  closeStoryViewer: () => void;
  // Notifications & Safety
  markNotificationsAsRead: () => void;
  reportContent: (contentId: string, reason: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users, updateProfile, updateUserById } = useAuth();

  // Posts State
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  // Stories State
  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_stories');
      return saved ? JSON.parse(saved) : INITIAL_STORIES;
    } catch {
      return INITIAL_STORIES;
    }
  });

  // Initial messages by chat mapping
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem('mehfil_messages_by_chat');
      if (saved) return JSON.parse(saved);
    } catch {}

    // Pre-populate with initial conversations using deterministic IDs
    const currentId = 'user_current';
    const initialMap: Record<string, Message[]> = {};

    const zoyaChatId = getDeterministicChatId(currentId, 'user_zoya');
    initialMap[zoyaChatId] = [
      {
        id: 'm_zoya_1',
        conversationId: zoyaChatId,
        senderId: 'user_zoya',
        senderName: 'Zoya Khan',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        text: 'Bilal! Sending you the exclusive pass for our Lahore acoustic concert tonight! 🎫✨',
        createdAt: '10:15 AM',
        seen: false,
      },
    ];

    const hamzaChatId = getDeterministicChatId(currentId, 'user_hamza');
    initialMap[hamzaChatId] = [
      {
        id: 'm_hamza_1',
        conversationId: hamzaChatId,
        senderId: currentId,
        senderName: 'Bilal Ahmed',
        senderAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
        text: 'Thanks for the route details for Hunza! Planning to hit the road next Wednesday.',
        createdAt: 'Yesterday',
        seen: true,
      },
    ];

    const daniyalChatId = getDeterministicChatId(currentId, 'user_daniyal');
    initialMap[daniyalChatId] = [
      {
        id: 'm_daniyal_1',
        conversationId: daniyalChatId,
        senderId: 'user_daniyal',
        senderName: 'Chef Daniyal',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        text: 'Hey Bilal, drop by the kitchen when you are in Gulberg, special deg is waiting!',
        createdAt: '2 days ago',
        seen: true,
      },
    ];

    return initialMap;
  });

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_conversations');
      if (saved) return JSON.parse(saved);
    } catch {}

    const currentId = 'user_current';
    return [
      {
        id: getDeterministicChatId(currentId, 'user_zoya'),
        participantIds: [currentId, 'user_zoya'].sort(),
        otherUser: users.find(u => u.id === 'user_zoya') || ({} as User),
        lastMessage: {
          id: 'm_zoya_1',
          conversationId: getDeterministicChatId(currentId, 'user_zoya'),
          senderId: 'user_zoya',
          senderName: 'Zoya Khan',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
          text: 'Bilal! Sending you the exclusive pass for our Lahore acoustic concert tonight! 🎫✨',
          createdAt: '10:15 AM',
          seen: false,
        },
        lastMessageTime: '2026-11-01T02:10:00Z',
        unreadCount: 1,
        updatedAt: '2026-11-01T02:10:00Z',
        isRequest: false,
      },
      {
        id: getDeterministicChatId(currentId, 'user_hamza'),
        participantIds: [currentId, 'user_hamza'].sort(),
        otherUser: users.find(u => u.id === 'user_hamza') || ({} as User),
        lastMessage: {
          id: 'm_hamza_1',
          conversationId: getDeterministicChatId(currentId, 'user_hamza'),
          senderId: currentId,
          senderName: 'Bilal Ahmed',
          senderAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
          text: 'Thanks for the route details for Hunza! Planning to hit the road next Wednesday.',
          createdAt: 'Yesterday',
          seen: true,
        },
        lastMessageTime: '2026-10-31T22:30:00Z',
        unreadCount: 0,
        updatedAt: '2026-10-31T22:30:00Z',
        isRequest: false,
      },
      {
        id: getDeterministicChatId(currentId, 'user_daniyal'),
        participantIds: [currentId, 'user_daniyal'].sort(),
        otherUser: users.find(u => u.id === 'user_daniyal') || ({} as User),
        lastMessage: {
          id: 'm_daniyal_1',
          conversationId: getDeterministicChatId(currentId, 'user_daniyal'),
          senderId: 'user_daniyal',
          senderName: 'Chef Daniyal',
          senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
          text: 'Hey Bilal, drop by the kitchen when you are in Gulberg, special deg is waiting!',
          createdAt: '2 days ago',
          seen: true,
        },
        lastMessageTime: '2026-10-30T14:12:00Z',
        unreadCount: 0,
        updatedAt: '2026-10-30T14:12:00Z',
        isRequest: false,
      },
    ];
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Active View States
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activePostId, setActivePostIdState] = useState<string | null>(null);
  const [activePostList, setActivePostList] = useState<Post[]>([]);
  const [activeStoryUserStories, setActiveStoryUserStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isTypingUserId, setIsTypingUserId] = useState<string | null>(null);

  // Sync to storage
  useEffect(() => {
    localStorage.setItem('mehfil_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('mehfil_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('mehfil_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('mehfil_messages_by_chat', JSON.stringify(messagesByChat));
  }, [messagesByChat]);

  useEffect(() => {
    localStorage.setItem('mehfil_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Handle URL hash changes for Post URLs: #/post/:postId
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/#\/?post\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        setActivePostIdState(match[1]);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const setActivePostId = useCallback((postId: string | null, list?: Post[]) => {
    setActivePostIdState(postId);
    if (list) setActivePostList(list);
    if (postId) {
      window.location.hash = `/post/${postId}`;
    } else {
      if (window.location.hash.includes('/post/')) {
        window.history.pushState(null, '', window.location.pathname);
      }
    }
  }, []);

  const getPostById = useCallback((postId: string) => {
    return posts.find(p => p.id === postId);
  }, [posts]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const unreadMessageCount = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

  // ============================================================
  // BUG 1: POSTS FULL VIEW & MUTATIONS
  // ============================================================
  const editPost = (
    postId: string,
    updates: { caption?: string; visibility?: 'public' | 'followers' | 'private' }
  ) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          caption: updates.caption !== undefined ? updates.caption : p.caption,
          visibility: updates.visibility !== undefined ? updates.visibility : p.visibility,
        };
      })
    );
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (currentUser) {
      updateProfile({ postsCount: Math.max(0, (currentUser.postsCount || 1) - 1) });
    }
    if (activePostId === postId) {
      setActivePostId(null);
    }
  };

  const toggleLikePost = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev =>
      prev.map(post => {
        if (post.id !== postId) return post;
        const alreadyLiked = post.likedBy.includes(currentUser.id);
        const newLikedBy = alreadyLiked
          ? post.likedBy.filter(id => id !== currentUser.id)
          : [...post.likedBy, currentUser.id];

        if (!alreadyLiked && post.authorId !== currentUser.id) {
          const newNotif: NotificationItem = {
            id: `notif_${Date.now()}`,
            recipientId: post.authorId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatarUrl,
            senderUsername: currentUser.username,
            type: 'like',
            targetPostId: post.id,
            targetPostThumbnail: post.thumbnailUrl || post.mediaUrl,
            message: 'liked your post.',
            createdAt: 'Just now',
            read: false,
          };
          setNotifications(n => [newNotif, ...n]);
        }

        return {
          ...post,
          likedBy: newLikedBy,
          likesCount: Math.max(0, post.likesCount + (alreadyLiked ? -1 : 1)),
        };
      })
    );
  };

  const toggleSavePost = (postId: string) => {
    if (!currentUser) return;
    const isSaved = currentUser.savedPosts.includes(postId);
    const updatedSaved = isSaved
      ? currentUser.savedPosts.filter(id => id !== postId)
      : [...currentUser.savedPosts, postId];

    updateProfile({ savedPosts: updatedSaved });

    setPosts(prev =>
      prev.map(post => {
        if (post.id !== postId) return post;
        const savedBy = post.savedBy || [];
        const updatedSavedBy = isSaved
          ? savedBy.filter(id => id !== currentUser.id)
          : [...savedBy, currentUser.id];
        return { ...post, savedBy: updatedSavedBy };
      })
    );
  };

  const addComment = (postId: string, text: string, replyToCommentId?: string) => {
    if (!currentUser || !text.trim()) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatarUrl,
      text: text.trim(),
      createdAt: 'Just now',
      likesCount: 0,
      likedBy: [],
      replies: [],
    };

    setPosts(prev =>
      prev.map(post => {
        if (post.id !== postId) return post;

        let updatedComments = [...post.comments];
        if (replyToCommentId) {
          updatedComments = updatedComments.map(c => {
            if (c.id === replyToCommentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newComment],
              };
            }
            return c;
          });
        } else {
          updatedComments.push(newComment);
        }

        if (post.authorId !== currentUser.id) {
          const newNotif: NotificationItem = {
            id: `notif_${Date.now()}`,
            recipientId: post.authorId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatarUrl,
            senderUsername: currentUser.username,
            type: 'comment',
            targetPostId: post.id,
            targetPostThumbnail: post.thumbnailUrl || post.mediaUrl,
            message: `commented: "${text.slice(0, 35)}${text.length > 35 ? '...' : ''}"`,
            createdAt: 'Just now',
            read: false,
          };
          setNotifications(n => [newNotif, ...n]);
        }

        return {
          ...post,
          comments: updatedComments,
          commentsCount: post.commentsCount + 1,
        };
      })
    );
  };

  const likeComment = (postId: string, commentId: string) => {
    if (!currentUser) return;
    setPosts(prev =>
      prev.map(post => {
        if (post.id !== postId) return post;
        const updatedComments = post.comments.map(c => {
          if (c.id === commentId) {
            const liked = c.likedBy.includes(currentUser.id);
            return {
              ...c,
              likedBy: liked ? c.likedBy.filter(id => id !== currentUser.id) : [...c.likedBy, currentUser.id],
              likesCount: Math.max(0, c.likesCount + (liked ? -1 : 1)),
            };
          }
          if (c.replies) {
            const updatedReplies = c.replies.map(r => {
              if (r.id === commentId) {
                const liked = r.likedBy.includes(currentUser.id);
                return {
                  ...r,
                  likedBy: liked ? r.likedBy.filter(id => id !== currentUser.id) : [...r.likedBy, currentUser.id],
                  likesCount: Math.max(0, r.likesCount + (liked ? -1 : 1)),
                };
              }
              return r;
            });
            return { ...c, replies: updatedReplies };
          }
          return c;
        });
        return { ...post, comments: updatedComments };
      })
    );
  };

  const createPost = (postData: {
    type: 'photo' | 'video';
    mediaUrl: string;
    caption: string;
    hashtags: string[];
    visibility: 'public' | 'followers' | 'private';
    musicTitle?: string;
  }) => {
    if (!currentUser) return;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatarUrl,
      type: postData.type,
      mediaUrl: postData.mediaUrl,
      thumbnailUrl: postData.type === 'photo' ? postData.mediaUrl : undefined,
      caption: postData.caption,
      hashtags: postData.hashtags,
      visibility: postData.visibility,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString(),
      musicTitle: postData.musicTitle || (postData.type === 'video' ? `Original Sound • ${currentUser.name}` : undefined),
      likedBy: [],
      savedBy: [],
      comments: [],
    };

    setPosts(prev => [newPost, ...prev]);
    updateProfile({ postsCount: (currentUser.postsCount || 0) + 1 });
  };

  // ============================================================
  // BUG 2: FOLLOWERS & FOLLOWING MANAGEMENT WITH SYNCHRONIZATION
  // ============================================================
  const followUser = (targetUserId: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    if (targetUser.isPrivate) {
      // Private account: send follow request
      const updatedPending = [...(targetUser.pendingFollowRequests || []), currentUser.id];
      updateUserById(targetUserId, { pendingFollowRequests: updatedPending });

      const newNotif: NotificationItem = {
        id: `req_${Date.now()}`,
        recipientId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatarUrl,
        senderUsername: currentUser.username,
        type: 'follow_request',
        message: 'requested to follow you.',
        createdAt: 'Just now',
        read: false,
        requestStatus: 'pending',
      };
      setNotifications(prev => [newNotif, ...prev]);
    } else {
      // Public account: instant follow
      // 1. Update current user's following list & count
      const updatedFollowing = [...(currentUser.following || []), targetUserId];
      updateProfile({
        following: updatedFollowing,
        followingCount: (currentUser.followingCount || 0) + 1,
      });

      // 2. Update target user's followers list & count
      const updatedFollowers = [...(targetUser.followers || []), currentUser.id];
      updateUserById(targetUserId, {
        followers: updatedFollowers,
        followersCount: (targetUser.followersCount || 0) + 1,
      });

      const newNotif: NotificationItem = {
        id: `notif_${Date.now()}`,
        recipientId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatarUrl,
        senderUsername: currentUser.username,
        type: 'follow',
        message: 'started following you.',
        createdAt: 'Just now',
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const unfollowUser = (targetUserId: string) => {
    if (!currentUser) return;
    const targetUser = users.find(u => u.id === targetUserId);

    // 1. Update current user's following list & count
    const updatedFollowing = (currentUser.following || []).filter(id => id !== targetUserId);
    updateProfile({
      following: updatedFollowing,
      followingCount: Math.max(0, (currentUser.followingCount || 1) - 1),
    });

    // 2. Update target user's followers list & count
    if (targetUser) {
      const updatedFollowers = (targetUser.followers || []).filter(id => id !== currentUser.id);
      updateUserById(targetUserId, {
        followers: updatedFollowers,
        followersCount: Math.max(0, (targetUser.followersCount || 1) - 1),
      });
    }
  };

  // Owner removes a follower from their own followers list
  const removeFollower = (userId: string, followerId: string) => {
    const ownerUser = users.find(u => u.id === userId);
    const followerUser = users.find(u => u.id === followerId);

    if (ownerUser) {
      const updatedFollowers = (ownerUser.followers || []).filter(id => id !== followerId);
      updateUserById(userId, {
        followers: updatedFollowers,
        followersCount: Math.max(0, (ownerUser.followersCount || 1) - 1),
      });
    }

    if (followerUser) {
      const updatedFollowing = (followerUser.following || []).filter(id => id !== userId);
      updateUserById(followerId, {
        following: updatedFollowing,
        followingCount: Math.max(0, (followerUser.followingCount || 1) - 1),
      });
    }
  };

  const acceptFollowRequest = (notificationId: string, requesterId: string) => {
    if (!currentUser) return;
    const requesterUser = users.find(u => u.id === requesterId);

    // Mark notification accepted
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, requestStatus: 'accepted', read: true } : n))
    );

    // Update current user's followers
    const updatedFollowers = [...(currentUser.followers || []), requesterId];
    const updatedPending = (currentUser.pendingFollowRequests || []).filter(id => id !== requesterId);
    updateProfile({
      followers: updatedFollowers,
      followersCount: (currentUser.followersCount || 0) + 1,
      pendingFollowRequests: updatedPending,
    });

    // Update requester user's following
    if (requesterUser) {
      const updatedFollowing = [...(requesterUser.following || []), currentUser.id];
      updateUserById(requesterId, {
        following: updatedFollowing,
        followingCount: (requesterUser.followingCount || 0) + 1,
      });
    }
  };

  const rejectFollowRequest = (notificationId: string, requesterId: string) => {
    if (!currentUser) return;
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, requestStatus: 'rejected', read: true } : n))
    );
    const updatedPending = (currentUser.pendingFollowRequests || []).filter(id => id !== requesterId);
    updateProfile({ pendingFollowRequests: updatedPending });
  };

  // ============================================================
  // BUG 3: REAL-TIME CHAT SYSTEM (Firestore onSnapshot Pattern)
  // ============================================================
  const openOrCreateConversationWithUser = (targetUser: User): Conversation => {
    if (!currentUser) throw new Error('Must be logged in to chat');

    const chatId = getDeterministicChatId(currentUser.id, targetUser.id);
    const existing = conversations.find(c => c.id === chatId);

    if (existing) {
      setActiveConversation(existing);
      return existing;
    }

    // Check if users follow each other; if not, first message is marked as request
    const mutualFollow =
      (currentUser.following || []).includes(targetUser.id) &&
      (targetUser.following || []).includes(currentUser.id);

    const newConv: Conversation = {
      id: chatId,
      participantIds: [currentUser.id, targetUser.id].sort(),
      otherUser: targetUser,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
      isRequest: !mutualFollow,
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv);
    return newConv;
  };

  const getMessagesForChat = (chatId: string): Message[] => {
    const raw = messagesByChat[chatId] || [];
    // Filter out messages deleted for the current user
    return raw.filter(m => !(m.deletedFor || []).includes(currentUser?.id || ''));
  };

  const sendMessage = (chatId: string, text: string, mediaUrl?: string) => {
    if (!currentUser || (!text.trim() && !mediaUrl)) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      text: text.trim(),
      mediaUrl,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      seen: false,
    };

    // Update messages map
    setMessagesByChat(prev => {
      const existing = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: [...existing, newMsg],
      };
    });

    // Update conversation metadata
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id !== chatId) return conv;
        return {
          ...conv,
          lastMessage: newMsg,
          lastMessageTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // Simulated response from mock creators
    const conv = conversations.find(c => c.id === chatId);
    if (conv && conv.otherUser && conv.otherUser.id.startsWith('user_')) {
      const otherUser = conv.otherUser;
      setIsTypingUserId(otherUser.id);

      setTimeout(() => {
        setIsTypingUserId(null);
        const replyResponses = [
          "Wah! Bohat khoob! ✨ Thanks for reaching out on Mehfil!",
          "Assalam o Alaikum! Hope you're having an awesome week. Let's collaborate soon!",
          "Loved this! Checking out your profile now 🎧🔥",
          "Apna andaz, apni mehfil! Really appreciate the love brother!",
        ];
        const randomReply = replyResponses[Math.floor(Math.random() * replyResponses.length)];
        const replyMsg: Message = {
          id: `msg_reply_${Date.now()}`,
          conversationId: chatId,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderAvatar: otherUser.avatarUrl,
          text: randomReply,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          seen: false,
        };

        setMessagesByChat(p => ({
          ...p,
          [chatId]: [...(p[chatId] || []), replyMsg],
        }));

        setConversations(cList =>
          cList.map(c => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              lastMessage: replyMsg,
              lastMessageTime: new Date().toISOString(),
              unreadCount: activeConversation?.id === chatId ? 0 : (c.unreadCount || 0) + 1,
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }, 2000);
    }
  };

  const deleteMessage = (chatId: string, messageId: string, scope: 'me' | 'everyone') => {
    setMessagesByChat(prev => {
      const list = prev[chatId] || [];
      const updated = list.map(m => {
        if (m.id !== messageId) return m;

        if (scope === 'everyone') {
          return {
            ...m,
            text: 'This message was deleted',
            mediaUrl: undefined,
            deletedForEveryone: true,
          };
        } else {
          // Delete for me
          const deletedFor = m.deletedFor || [];
          return {
            ...m,
            deletedFor: currentUser ? [...deletedFor, currentUser.id] : deletedFor,
          };
        }
      });
      return { ...prev, [chatId]: updated };
    });
  };

  const markConversationSeen = (chatId: string) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== chatId) return c;
        return {
          ...c,
          unreadCount: 0,
          lastMessage: c.lastMessage ? { ...c.lastMessage, seen: true } : undefined,
        };
      })
    );

    setMessagesByChat(prev => {
      const list = prev[chatId] || [];
      const updated = list.map(m => ({ ...m, seen: true }));
      return { ...prev, [chatId]: updated };
    });
  };

  const acceptMessageRequest = (chatId: string) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== chatId) return c;
        return { ...c, isRequest: false };
      })
    );
  };

  // Stories
  const createStory = (mediaUrl: string, type: 'image' | 'video', caption?: string) => {
    if (!currentUser) return;
    const newStory: Story = {
      id: `story_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatarUrl,
      mediaUrl,
      type,
      caption,
      createdAt: new Date().toISOString(),
      viewedBy: [currentUser.id],
    };
    setStories(prev => [newStory, ...prev]);
  };

  const viewStory = (storyId: string) => {
    if (!currentUser) return;
    setStories(prev =>
      prev.map(s => {
        if (s.id !== storyId) return s;
        if (s.viewedBy.includes(currentUser.id)) return s;
        return { ...s, viewedBy: [...s.viewedBy, currentUser.id] };
      })
    );
  };

  const openStoryViewer = (storyList: Story[], startIndex = 0) => {
    setActiveStoryUserStories(storyList);
    setActiveStoryIndex(startIndex);
  };

  const closeStoryViewer = () => {
    setActiveStoryUserStories([]);
    setActiveStoryIndex(null);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const reportContent = (_contentId: string, _reason: string) => {};

  return (
    <DataContext.Provider
      value={{
        posts,
        stories,
        conversations,
        notifications,
        activeConversation,
        activePostId,
        activePostList,
        activeStoryIndex,
        activeStoryUserStories,
        unreadNotificationCount,
        unreadMessageCount,
        isTypingUserId,
        setActivePostId,
        getPostById,
        editPost,
        deletePost,
        toggleLikePost,
        toggleSavePost,
        addComment,
        likeComment,
        createPost,
        followUser,
        unfollowUser,
        removeFollower,
        acceptFollowRequest,
        rejectFollowRequest,
        setActiveConversation,
        openOrCreateConversationWithUser,
        getMessagesForChat,
        sendMessage,
        deleteMessage,
        markConversationSeen,
        acceptMessageRequest,
        createStory,
        viewStory,
        openStoryViewer,
        closeStoryViewer,
        markNotificationsAsRead,
        reportContent,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
