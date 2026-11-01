export type AccountType = 'public' | 'private';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  link?: string;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  createdAt: string;
  blockedUsers: string[];
  savedPosts: string[];
  followers: string[]; // user IDs
  following: string[]; // user IDs
  pendingFollowRequests: string[]; // user IDs of people who requested to follow this user
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  likesCount: number;
  likedBy: string[];
  replies?: Comment[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  type: 'video' | 'photo';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption: string;
  hashtags: string[];
  visibility: 'public' | 'followers' | 'private';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  musicTitle?: string;
  likedBy: string[];
  savedBy: string[];
  comments: Comment[];
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  mediaUrl: string;
  type: 'video' | 'image';
  caption?: string;
  createdAt: string;
  viewedBy: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  createdAt: string;
  seen: boolean;
  isDeleted?: boolean;
  deletedForEveryone?: boolean;
  deletedFor?: string[]; // uids for whom this message is hidden locally
}

export interface Conversation {
  id: string; // sorted: uid1_uid2
  participantIds: string[];
  otherUser: User;
  lastMessage?: Message;
  lastMessageTime?: string;
  unreadCount: number;
  unreadCounts?: Record<string, number>;
  updatedAt: string;
  isRequest?: boolean;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderUsername: string;
  type: 'like' | 'comment' | 'follow' | 'follow_request';
  targetPostId?: string;
  targetPostThumbnail?: string;
  message: string;
  createdAt: string;
  read: boolean;
  requestStatus?: 'pending' | 'accepted' | 'rejected';
}

export interface FollowListItem {
  id: string;
  uid: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  isPrivate?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsProfileSetup: boolean;
}
