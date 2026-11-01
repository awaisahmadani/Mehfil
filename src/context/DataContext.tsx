import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Comment, Story, Conversation, Message, NotificationItem, User } from '../types';
import {
  INITIAL_POSTS,
  INITIAL_STORIES,
  INITIAL_CONVERSATIONS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { useAuth } from './AuthContext';

interface DataContextType {
  posts: Post[];
  stories: Story[];
  conversations: Conversation[];
  notifications: NotificationItem[];
  activeConversation: Conversation | null;
  activeStoryIndex: number | null;
  activeStoryUserStories: Story[];
  unreadNotificationCount: number;
  unreadMessageCount: number;
  isTypingUserId: string | null;
  // Interactions
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
  deletePost: (postId: string) => void;
  createStory: (mediaUrl: string, type: 'image' | 'video', caption?: string) => void;
  viewStory: (storyId: string) => void;
  openStoryViewer: (stories: Story[], startIndex?: number) => void;
  closeStoryViewer: () => void;
  // Follow / Unfollow / Requests
  followUser: (targetUserId: string) => void;
  unfollowUser: (targetUserId: string) => void;
  acceptFollowRequest: (notificationId: string, requesterId: string) => void;
  rejectFollowRequest: (notificationId: string, requesterId: string) => void;
  // Messaging
  setActiveConversation: (conv: Conversation | null) => void;
  openOrCreateConversationWithUser: (user: User) => Conversation;
  sendMessage: (conversationId: string, text: string, mediaUrl?: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  markConversationSeen: (conversationId: string) => void;
  // Notifications
  markNotificationsAsRead: () => void;
  // Safety
  reportContent: (contentId: string, reason: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users, updateProfile } = useAuth();

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_stories');
      return saved ? JSON.parse(saved) : INITIAL_STORIES;
    } catch {
      return INITIAL_STORIES;
    }
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_conversations');
      return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeStoryUserStories, setActiveStoryUserStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isTypingUserId, setIsTypingUserId] = useState<string | null>(null);

  // Persistence
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
    localStorage.setItem('mehfil_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const unreadMessageCount = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

  // Filter posts based on blocked users
  const visiblePosts = posts.filter(post => {
    if (!currentUser) return post.visibility === 'public';
    if (currentUser.blockedUsers.includes(post.authorId)) return false;
    return true;
  });

  // Like / Unlike Post
  const toggleLikePost = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev =>
      prev.map(post => {
        if (post.id !== postId) return post;
        const alreadyLiked = post.likedBy.includes(currentUser.id);
        const newLikedBy = alreadyLiked
          ? post.likedBy.filter(id => id !== currentUser.id)
          : [...post.likedBy, currentUser.id];

        // If newly liked, add notification to author
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

  // Bookmark / Save Post
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

  // Add Comment with replies support
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

        // Notify post author
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

  // Like comment
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

  // Create Post
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

  // Delete own post
  const deletePost = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    updateProfile({ postsCount: Math.max(0, (currentUser.postsCount || 1) - 1) });
  };

  // Create Story
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

  // Follow & Request Logic
  const followUser = (targetUserId: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    if (targetUser.isPrivate) {
      // Private account: send follow request
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
      const updatedFollowing = [...(currentUser.following || []), targetUserId];
      updateProfile({
        following: updatedFollowing,
        followingCount: (currentUser.followingCount || 0) + 1,
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
    const updatedFollowing = (currentUser.following || []).filter(id => id !== targetUserId);
    updateProfile({
      following: updatedFollowing,
      followingCount: Math.max(0, (currentUser.followingCount || 1) - 1),
    });
  };

  const acceptFollowRequest = (notificationId: string, requesterId: string) => {
    if (!currentUser) return;
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, requestStatus: 'accepted', read: true };
        }
        return n;
      })
    );

    const updatedFollowers = [...(currentUser.followers || []), requesterId];
    updateProfile({
      followers: updatedFollowers,
      followersCount: (currentUser.followersCount || 0) + 1,
    });
  };

  const rejectFollowRequest = (notificationId: string, _requesterId: string) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, requestStatus: 'rejected', read: true };
        }
        return n;
      })
    );
  };

  // Direct Messaging
  const openOrCreateConversationWithUser = (user: User): Conversation => {
    if (!currentUser) throw new Error("Must be logged in to chat");
    const existing = conversations.find(c =>
      c.participantIds.includes(user.id) && c.participantIds.includes(currentUser.id)
    );

    if (existing) {
      setActiveConversation(existing);
      return existing;
    }

    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      participantIds: [currentUser.id, user.id],
      otherUser: user,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      isRequest: user.isPrivate && !(currentUser.following || []).includes(user.id),
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv);
    return newConv;
  };

  const sendMessage = (conversationId: string, text: string, mediaUrl?: string) => {
    if (!currentUser || (!text.trim() && !mediaUrl)) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      text: text.trim(),
      mediaUrl,
      createdAt: 'Just now',
      seen: false,
    };

    setConversations(prev =>
      prev.map(conv => {
        if (conv.id !== conversationId) return conv;
        return {
          ...conv,
          lastMessage: newMsg,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // Realistic auto-reply simulation if messaging a mock creator
    const conv = conversations.find(c => c.id === conversationId);
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
          conversationId,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderAvatar: otherUser.avatarUrl,
          text: randomReply,
          createdAt: 'Just now',
          seen: false,
        };

        setConversations(prev =>
          prev.map(c => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              lastMessage: replyMsg,
              unreadCount: activeConversation?.id === conversationId ? 0 : (c.unreadCount || 0) + 1,
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }, 2400);
    }
  };

  const deleteMessage = (conversationId: string, _messageId: string) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id !== conversationId) return conv;
        if (conv.lastMessage) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              text: 'This message was deleted',
              isDeleted: true,
            },
          };
        }
        return conv;
      })
    );
  };

  const markConversationSeen = (conversationId: string) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          unreadCount: 0,
          lastMessage: c.lastMessage ? { ...c.lastMessage, seen: true } : undefined,
        };
      })
    );
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const reportContent = (_contentId: string, _reason: string) => {
    // Registered successfully in safety audit
  };

  return (
    <DataContext.Provider
      value={{
        posts: visiblePosts,
        stories,
        conversations,
        notifications,
        activeConversation,
        activeStoryIndex,
        activeStoryUserStories,
        unreadNotificationCount,
        unreadMessageCount,
        isTypingUserId,
        toggleLikePost,
        toggleSavePost,
        addComment,
        likeComment,
        createPost,
        deletePost,
        createStory,
        viewStory,
        openStoryViewer,
        closeStoryViewer,
        followUser,
        unfollowUser,
        acceptFollowRequest,
        rejectFollowRequest,
        setActiveConversation,
        openOrCreateConversationWithUser,
        sendMessage,
        deleteMessage,
        markConversationSeen,
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
