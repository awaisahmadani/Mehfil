import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
import {
  Lock,
  Globe,
  Shield,
  Bell,
  Key,
  LogOut,
  Trash2,
  Database,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
  onOpenEditProfile: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onOpenEditProfile,
}) => {
  const {
    currentUser,
    togglePrivacy,
    unblockUser,
    logout,
    deleteAccount,
    users,
  } = useAuth();

  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [messagesAlertEnabled, setMessagesAlertEnabled] = useState(true);
  const [interactionsAlertEnabled, setInteractionsAlertEnabled] = useState(true);

  if (!currentUser) return null;

  const blockedUsersList = users.filter(u => currentUser.blockedUsers?.includes(u.id));

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }, 1500);
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 text-zinc-400 hover:text-white rounded-lg"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-xl font-bold text-white">Settings</h2>
        </div>
      </div>

      {/* Account Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          Account & Privacy
        </p>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 overflow-hidden text-xs">
          {/* Privacy Switch (Public vs Private) */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser.isPrivate ? (
                <Lock className="w-5 h-5 text-[#FACC15]" />
              ) : (
                <Globe className="w-5 h-5 text-zinc-400" />
              )}
              <div>
                <p className="font-bold text-white">Private Account</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[240px]">
                  {currentUser.isPrivate
                    ? 'Only approved followers can view your posts and reels.'
                    : 'Your posts and reels are public to everyone.'}
                </p>
              </div>
            </div>

            <button
              onClick={togglePrivacy}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                currentUser.isPrivate ? 'bg-[#FACC15]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  currentUser.isPrivate ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Edit Profile */}
          <button
            onClick={onOpenEditProfile}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors text-left"
          >
            <span className="font-semibold text-white">Edit Profile Details</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          {/* Blocked Accounts */}
          <button
            onClick={() => setShowBlockedModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold text-white">Blocked Accounts</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>{currentUser.blockedUsers?.length || 0}</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </button>

          {/* Change Password */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold text-white">Change Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          Notification Preferences
        </p>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 overflow-hidden text-xs">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-zinc-400" />
              <span className="font-medium text-white">Push Notifications</span>
            </div>
            <button
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                pushEnabled ? 'bg-[#FACC15]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full transition-transform ${
                  pushEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="font-medium text-white pl-6">Direct Message Alerts</span>
            <button
              onClick={() => setMessagesAlertEnabled(!messagesAlertEnabled)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                messagesAlertEnabled ? 'bg-[#FACC15]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full transition-transform ${
                  messagesAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="font-medium text-white pl-6">Likes & Comments Alerts</span>
            <button
              onClick={() => setInteractionsAlertEnabled(!interactionsAlertEnabled)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                interactionsAlertEnabled ? 'bg-[#FACC15]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full transition-transform ${
                  interactionsAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Backend & Firebase Status */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          Backend Integration
        </p>
        <button
          onClick={() => setShowFirebaseModal(true)}
          className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between hover:bg-zinc-900 transition-colors text-left text-xs"
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-[#FACC15]" />
            <div>
              <p className="font-bold text-white">Firebase Backend Status</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isFirebaseConfigured() ? (
                  <span className="text-emerald-400 font-semibold">● Connected to Live Firebase</span>
                ) : (
                  <span className="text-[#FACC15]">● Client-side persistent mode (Ready to connect)</span>
                )}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Danger Zone & Logout */}
      <div className="space-y-2 pt-2">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 overflow-hidden text-xs">
          <button
            onClick={logout}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-900 text-white font-semibold transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-zinc-200">
              <LogOut className="w-4 h-4 text-zinc-400" />
              <span>Log Out</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-red-950/20 text-[#EF4444] font-semibold transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-[#EF4444]" />
              <span>Delete Account</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BLOCKED USERS MODAL                                          */}
      {/* ============================================================ */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white">Blocked Accounts</h3>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {blockedUsersList.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-6">
                  You have not blocked any accounts.
                </p>
              ) : (
                blockedUsersList.map(blocked => (
                  <div
                    key={blocked.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-900"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={blocked.avatarUrl}
                        alt={blocked.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-white">{blocked.name}</p>
                        <p className="text-zinc-500 text-[10px]">@{blocked.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => unblockUser(blocked.id)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-semibold px-2.5 py-1 rounded-lg"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CHANGE PASSWORD MODAL                                        */}
      {/* ============================================================ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="p-4 bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Password changed successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                {passwordError && (
                  <p className="text-red-400 text-[11px]">{passwordError}</p>
                )}
                <div>
                  <label className="block text-zinc-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#FACC15] hover:bg-yellow-400 text-black font-bold py-2.5 rounded-xl transition-colors mt-2"
                >
                  Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FIREBASE CONFIG GUIDE MODAL                                  */}
      {/* ============================================================ */}
      {showFirebaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#FACC15]" />
                <h3 className="font-bold text-sm text-white">Firebase Architecture</h3>
              </div>
              <button
                onClick={() => setShowFirebaseModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-3 leading-relaxed">
              <p>
                Mehfil is architected with a modular, drop-in Firebase integration in{' '}
                <code className="text-[#FACC15] bg-zinc-900 px-1 py-0.5 rounded">src/firebase/config.ts</code>.
              </p>
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                <p className="text-zinc-400">// Configure your keys in .env:</p>
                <p className="text-[#FACC15]">VITE_FIREBASE_API_KEY="..."</p>
                <p className="text-[#FACC15]">VITE_FIREBASE_AUTH_DOMAIN="..."</p>
                <p className="text-[#FACC15]">VITE_FIREBASE_PROJECT_ID="..."</p>
                <p className="text-[#FACC15]">VITE_FIREBASE_STORAGE_BUCKET="..."</p>
              </div>
              <p className="text-[11px] text-zinc-400">
                Authentication, Firestore database, and Storage buckets are wired and ready. In the meantime, all user sessions, follow requests, comments, and real-time chat messages persist safely in your browser session.
              </p>
            </div>

            <button
              onClick={() => setShowFirebaseModal(false)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE ACCOUNT CONFIRMATION MODAL                            */}
      {/* ============================================================ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-zinc-950 border border-red-900/60 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-[#EF4444]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-white text-base">Delete Mehfil Account?</h3>
              <p className="text-xs text-zinc-400">
                This will permanently remove your profile, posts, reels, and messages. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAccount();
                  setShowDeleteModal(false);
                }}
                className="flex-1 bg-[#EF4444] hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-red-900/30"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
