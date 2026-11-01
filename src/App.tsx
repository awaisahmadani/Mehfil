/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { AuthFlow } from './screens/AuthFlow';
import { ProfileSetup } from './screens/ProfileSetup';
import { HomeScreen } from './screens/HomeScreen';
import { SearchScreen } from './screens/SearchScreen';
import { UploadScreen } from './screens/UploadScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { BottomNav, TabType } from './components/BottomNav';
import { StoryViewerModal } from './components/StoryViewerModal';
import { FullPostModal } from './components/FullPostModal';
import { User } from './types';

function MainApp() {
  const { isAuthenticated, needsProfileSetup, currentUser } = useAuth();
  const {
    posts,
    activePostId,
    activePostList,
    setActivePostId,
    activeStoryUserStories,
    activeStoryIndex,
    closeStoryViewer,
    openOrCreateConversationWithUser,
  } = useData();

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // STEP 1: If not authenticated, show Welcome & Auth screens
  if (!isAuthenticated) {
    return <AuthFlow initialView="welcome" />;
  }

  // STEP 2: Profile setup screen shown once after signup or new Google user
  if (needsProfileSetup) {
    return <ProfileSetup />;
  }

  // Navigation Handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
  };

  const handleOpenMessagesWithUser = (user: User) => {
    openOrCreateConversationWithUser(user);
    setSelectedUserId(null);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
    setCurrentTab('messages');
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    setSelectedUserId(null);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col relative selection:bg-[#FACC15] selection:text-black">
      {/* Active Screen View */}
      <div className="flex-1 w-full">
        {/* Full View: Notifications */}
        {isNotificationsOpen ? (
          <NotificationsScreen
            onSelectUser={handleSelectUser}
          />
        ) : isSettingsOpen ? (
          /* Full View: Settings */
          <SettingsScreen
            onBack={() => setIsSettingsOpen(false)}
            onOpenEditProfile={() => {
              setIsSettingsOpen(false);
              setCurrentTab('profile');
              setSelectedUserId(null);
            }}
          />
        ) : selectedUserId ? (
          /* Full View: Selected User Profile */
          <div className="w-full">
            <div className="max-w-lg mx-auto pt-2 px-4">
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-xs text-[#FACC15] font-semibold hover:underline flex items-center gap-1 mb-2"
              >
                ← Back to previous
              </button>
            </div>
            <ProfileScreen
              userId={selectedUserId}
              onOpenMessagesWithUser={handleOpenMessagesWithUser}
              onSelectUser={handleSelectUser}
            />
          </div>
        ) : (
          /* Main Tab Views */
          <>
            {currentTab === 'home' && (
              <HomeScreen
                onSelectUser={handleSelectUser}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                onOpenMessages={() => setCurrentTab('messages')}
              />
            )}
            {currentTab === 'search' && (
              <SearchScreen onSelectUser={handleSelectUser} />
            )}
            {currentTab === 'upload' && (
              <UploadScreen onSuccess={() => setCurrentTab('home')} />
            )}
            {currentTab === 'messages' && (
              <MessagesScreen onSelectUser={handleSelectUser} />
            )}
            {currentTab === 'profile' && (
              <ProfileScreen
                userId={currentUser?.id}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onSelectUser={handleSelectUser}
              />
            )}
          </>
        )}
      </div>

      {/* Persistent Bottom Navigation (Mobile + Desktop friendly) */}
      <BottomNav
        currentTab={
          isNotificationsOpen || isSettingsOpen || selectedUserId
            ? ('' as any)
            : currentTab
        }
        onTabChange={handleTabChange}
      />

      {/* Story Viewer Modal (Instagram style full screen with progress timer) */}
      {activeStoryUserStories.length > 0 && activeStoryIndex !== null && (
        <StoryViewerModal
          stories={activeStoryUserStories}
          initialIndex={activeStoryIndex}
          onClose={closeStoryViewer}
        />
      )}

      {/* Full Post Modal (BUG 1: Route #/post/:postId support, refresh, and full post view) */}
      {activePostId && (
        <FullPostModal
          postId={activePostId}
          postList={activePostList.length > 0 ? activePostList : posts}
          onClose={() => setActivePostId(null)}
          onSelectUser={handleSelectUser}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
