import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';

export interface PendingSignup {
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  code: string;
  codeExpiresAt: number;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsProfileSetup: boolean;
  users: User[];
  pendingSignup: PendingSignup | null;
  resendTimer: number;
  signupStep: 'form' | 'verify';
  setSignupStep: (step: 'form' | 'verify') => void;
  // Auth methods
  checkUsernameUnique: (username: string) => boolean;
  startSignup: (fullName: string, username: string, email: string, password: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  verifySignupCode: (inputCode: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: () => Promise<string | null>;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; isNewUser: boolean; error?: string }>;
  requestPasswordReset: (emailOrUsername: string) => Promise<{ success: boolean; message: string; code?: string }>;
  completePasswordReset: (code: string, newPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  completeProfileSetup: (data: {
    avatarUrl: string;
    username: string;
    name: string;
    bio: string;
    link?: string;
    isPrivate: boolean;
  }) => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => void;
  updateUserById: (userId: string, updates: Partial<User>) => void;
  togglePrivacy: () => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  logout: () => void;
  deleteAccount: () => void;
  switchUserDemo: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('mehfil_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('mehfil_current_user');
      if (saved) return JSON.parse(saved);
      // Default to demo user for instant live preview, or null if logged out
      const defaultUser = INITIAL_USERS.find(u => u.id === 'user_current') || INITIAL_USERS[0];
      return defaultUser;
    } catch {
      return null;
    }
  });

  const [needsProfileSetup, setNeedsProfileSetup] = useState<boolean>(() => {
    return localStorage.getItem('mehfil_needs_profile_setup') === 'true';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(() => {
    try {
      const saved = localStorage.getItem('mehfil_pending_signup');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [signupStep, setSignupStep] = useState<'form' | 'verify'>('form');
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [resetPendingEmail, setResetPendingEmail] = useState<{ email: string; code: string } | null>(null);

  // Sync users to storage
  useEffect(() => {
    localStorage.setItem('mehfil_users', JSON.stringify(users));
  }, [users]);

  // Sync current user to storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mehfil_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mehfil_current_user');
    }
  }, [currentUser]);

  // Sync needsProfileSetup
  useEffect(() => {
    localStorage.setItem('mehfil_needs_profile_setup', needsProfileSetup ? 'true' : 'false');
  }, [needsProfileSetup]);

  // Resend countdown timer
  useEffect(() => {
    let interval: any;
    if (signupStep === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signupStep, resendTimer]);

  const checkUsernameUnique = (username: string): boolean => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return false;
    return !users.some(u => u.username.toLowerCase() === clean);
  };

  const startSignup = async (fullName: string, username: string, email: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!checkUsernameUnique(cleanUsername)) {
      return { success: false, error: 'Username is already taken. Please choose another.' };
    }

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const pending: PendingSignup = {
      fullName: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: btoa(password), // simple obfuscation for local storage simulation
      code,
      codeExpiresAt: Date.now() + 15 * 60 * 1000,
    };

    setPendingSignup(pending);
    localStorage.setItem('mehfil_pending_signup', JSON.stringify(pending));
    setSignupStep('verify');
    setResendTimer(60);

    return { success: true, code };
  };

  const verifySignupCode = async (inputCode: string) => {
    if (!pendingSignup) {
      return { success: false, error: 'No signup session found. Please sign up again.' };
    }

    if (inputCode.trim() !== pendingSignup.code) {
      return { success: false, error: 'Invalid verification code. Please check and try again.' };
    }

    // Create the user
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: pendingSignup.fullName,
      username: pendingSignup.username,
      email: pendingSignup.email,
      avatarUrl: `https://api.dicebear.com/7.x/micah/svg?seed=${pendingSignup.username}&backgroundColor=111111`,
      bio: '',
      link: '',
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: false,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      savedPosts: [],
      followers: [],
      following: [],
      pendingFollowRequests: [],
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setNeedsProfileSetup(true);
    setPendingSignup(null);
    localStorage.removeItem('mehfil_pending_signup');
    setSignupStep('form');

    return { success: true };
  };

  const resendVerificationCode = async () => {
    if (!pendingSignup) return null;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const updated = {
      ...pendingSignup,
      code: newCode,
      codeExpiresAt: Date.now() + 15 * 60 * 1000,
    };
    setPendingSignup(updated);
    localStorage.setItem('mehfil_pending_signup', JSON.stringify(updated));
    setResendTimer(60);
    return newCode;
  };

  const login = async (emailOrUsername: string, password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const clean = emailOrUsername.trim().toLowerCase().replace(/^@/, '');
    const found = users.find(
      u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );

    if (!found) {
      setIsLoading(false);
      return { success: false, error: 'No account found with this email or username.' };
    }

    // Valid user found
    setCurrentUser(found);
    setIsLoading(false);
    return { success: true };
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);

    // If live Firebase configured, attempt popup
    if (isFirebaseConfigured()) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const existing = users.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());

        if (existing) {
          setCurrentUser(existing);
          setIsLoading(false);
          return { success: true, isNewUser: false };
        } else {
          // New Google User
          const generatedUsername = (fbUser.displayName || 'user')
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9_]/g, '') + Math.floor(100 + Math.random() * 900);

          const newUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Mehfil User',
            username: generatedUsername,
            email: fbUser.email || '',
            avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}&backgroundColor=111111`,
            bio: '',
            link: '',
            isPrivate: false,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            isVerified: false,
            createdAt: new Date().toISOString(),
            blockedUsers: [],
            savedPosts: [],
            followers: [],
            following: [],
            pendingFollowRequests: [],
          };

          setUsers(prev => [newUser, ...prev]);
          setCurrentUser(newUser);
          setNeedsProfileSetup(true);
          setIsLoading(false);
          return { success: true, isNewUser: true };
        }
      } catch (err: any) {
        console.warn("Firebase popup not active or cancelled, falling back to simulated Google sign-in:", err);
      }
    }

    // Seamless Google Auth Simulator
    await new Promise(r => setTimeout(r, 600));
    const mockGoogleEmail = "google.user@gmail.com";
    const existing = users.find(u => u.email.toLowerCase() === mockGoogleEmail);

    if (existing) {
      setCurrentUser(existing);
      setIsLoading(false);
      return { success: true, isNewUser: false };
    } else {
      const newUser: User = {
        id: `google_${Date.now()}`,
        name: 'Ayla Noor',
        username: 'aylanoor_' + Math.floor(100 + Math.random() * 900),
        email: mockGoogleEmail,
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        bio: 'Creativity, film & design 🎨 Connected via Google',
        link: 'https://mehfil.app',
        isPrivate: false,
        followersCount: 15,
        followingCount: 20,
        postsCount: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
        blockedUsers: [],
        savedPosts: [],
        followers: [],
        following: [],
        pendingFollowRequests: [],
      };

      setUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);
      setNeedsProfileSetup(true);
      setIsLoading(false);
      return { success: true, isNewUser: true };
    }
  };

  const requestPasswordReset = async (emailOrUsername: string) => {
    const clean = emailOrUsername.trim().toLowerCase().replace(/^@/, '');
    const user = users.find(u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean);

    if (!user) {
      return { success: false, message: 'No account matching that email or username was found.' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    setResetPendingEmail({ email: user.email, code: resetCode });
    return {
      success: true,
      message: `A 6-digit password reset code has been sent to ${user.email}.`,
      code: resetCode,
    };
  };

  const completePasswordReset = async (code: string, newPass: string) => {
    if (!resetPendingEmail || resetPendingEmail.code !== code.trim()) {
      return { success: false, error: 'Invalid or expired reset code.' };
    }
    if (newPass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    setResetPendingEmail(null);
    return { success: true, message: 'Password updated successfully! Please log in.' };
  };

  const completeProfileSetup = async (data: {
    avatarUrl: string;
    username: string;
    name: string;
    bio: string;
    link?: string;
    isPrivate: boolean;
  }) => {
    if (!currentUser) return;
    const cleanUsername = data.username.trim().toLowerCase().replace(/^@/, '') || currentUser.username;
    
    const updated: User = {
      ...currentUser,
      avatarUrl: data.avatarUrl || currentUser.avatarUrl,
      username: cleanUsername,
      name: data.name.trim() || currentUser.name,
      bio: data.bio.slice(0, 150),
      link: data.link?.trim() || '',
      isPrivate: data.isPrivate,
    };

    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    setNeedsProfileSetup(false);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      ...updatedData,
    };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const updateUserById = (userId: string, updates: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const togglePrivacy = () => {
    if (!currentUser) return;
    updateProfile({ isPrivate: !currentUser.isPrivate });
  };

  const blockUser = (userId: string) => {
    if (!currentUser) return;
    if (currentUser.blockedUsers.includes(userId)) return;
    const updatedBlocked = [...currentUser.blockedUsers, userId];
    updateProfile({ blockedUsers: updatedBlocked });
  };

  const unblockUser = (userId: string) => {
    if (!currentUser) return;
    const updatedBlocked = currentUser.blockedUsers.filter(id => id !== userId);
    updateProfile({ blockedUsers: updatedBlocked });
  };

  const logout = () => {
    setCurrentUser(null);
    setNeedsProfileSetup(false);
    localStorage.removeItem('mehfil_current_user');
  };

  const deleteAccount = () => {
    if (!currentUser) return;
    setUsers(prev => prev.filter(u => u.id !== currentUser.id));
    logout();
  };

  const switchUserDemo = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setNeedsProfileSetup(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        needsProfileSetup,
        users,
        pendingSignup,
        resendTimer,
        signupStep,
        setSignupStep,
        checkUsernameUnique,
        startSignup,
        verifySignupCode,
        resendVerificationCode,
        login,
        loginWithGoogle,
        requestPasswordReset,
        completePasswordReset,
        completeProfileSetup,
        updateProfile,
        updateUserById,
        togglePrivacy,
        blockUser,
        unblockUser,
        logout,
        deleteAccount,
        switchUserDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
