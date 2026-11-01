import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { Camera, Lock, Globe, Check, Link as LinkIcon, Sparkles } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
];

export const ProfileSetup: React.FC = () => {
  const { currentUser, completeProfileSetup } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>(
    currentUser?.avatarUrl || PRESET_AVATARS[0]
  );
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [username, setUsername] = useState<string>(currentUser?.username || '');
  const [bio, setBio] = useState<string>(
    currentUser?.bio || 'Apna andaz, apni mehfil! ✨'
  );
  const [link, setLink] = useState<string>(currentUser?.link || '');
  const [isPrivate, setIsPrivate] = useState<boolean>(currentUser?.isPrivate || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    await completeProfileSetup({
      avatarUrl,
      username: username.trim() || (currentUser?.username || 'user'),
      name: name.trim() || (currentUser?.name || 'Mehfil User'),
      bio: bio.slice(0, 150),
      link: link.trim(),
      isPrivate,
    });
    setIsSubmitting(false);
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    await completeProfileSetup({
      avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/micah/svg?seed=${currentUser?.username}&backgroundColor=111111`,
      username: currentUser?.username || 'user',
      name: currentUser?.name || 'Mehfil User',
      bio: '',
      link: '',
      isPrivate: false,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#111111] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-950/95 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-xs text-zinc-400 hover:text-white font-medium hover:underline"
          >
            Skip for now
          </button>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            Complete Your Profile
            <Sparkles className="w-5 h-5 text-[#FACC15]" />
          </h2>
          <p className="text-xs text-zinc-400">
            Tell the Mehfil community about yourself. You can change this anytime.
          </p>
        </div>

        {/* Profile Picture (DP) Upload & Crop/Preview */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#EF4444] via-[#FACC15] to-amber-500 shadow-xl overflow-hidden">
              <img
                src={avatarUrl}
                alt="Profile Preview"
                className="w-full h-full rounded-full object-cover bg-zinc-900"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Camera className="w-6 h-6" />
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 bg-[#FACC15] text-black rounded-full border-2 border-zinc-950 shadow-md">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <p className="text-[11px] text-zinc-400">
            Click photo to upload or pick a preset avatar below:
          </p>

          {/* Preset Avatars Row */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto max-w-full pb-1">
            {PRESET_AVATARS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarUrl(preset)}
                className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 transition-all ${
                  avatarUrl === preset ? 'border-[#FACC15] scale-110' : 'border-zinc-700 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 px-3"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-7 pr-3"
                />
              </div>
            </div>
          </div>

          {/* Bio with 150-char counter */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-zinc-300">Bio</label>
              <span className={`text-[11px] ${bio.length >= 140 ? 'text-[#EF4444]' : 'text-zinc-500'}`}>
                {bio.length}/150
              </span>
            </div>
            <textarea
              maxLength={150}
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="What makes your Mehfil special? (Music, photography, poetry, chai...)"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl p-3 resize-none"
            />
          </div>

          {/* Optional link */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Website or Social Link (Optional)</label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://yourlink.com"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-10 pr-3 placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Privacy Choice (Public vs Private) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">Account Privacy</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setIsPrivate(false)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  !isPrivate
                    ? 'border-[#FACC15] bg-yellow-950/20 shadow-[0_0_15px_rgba(250,204,21,0.15)]'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Globe className={`w-4 h-4 ${!isPrivate ? 'text-[#FACC15]' : 'text-zinc-400'}`} />
                    <span className="text-sm font-semibold text-white">Public Account</span>
                  </div>
                  {!isPrivate && <Check className="w-4 h-4 text-[#FACC15]" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Anyone can view your posts, reels, and stories. Anyone can follow you instantly.
                </p>
              </div>

              <div
                onClick={() => setIsPrivate(true)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isPrivate
                    ? 'border-[#FACC15] bg-yellow-950/20 shadow-[0_0_15px_rgba(250,204,21,0.15)]'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 ${isPrivate ? 'text-[#FACC15]' : 'text-zinc-400'}`} />
                    <span className="text-sm font-semibold text-white">Private Account</span>
                  </div>
                  {isPrivate && <Check className="w-4 h-4 text-[#FACC15]" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Only followers you approve can see your posts. Others only see your DP, bio & counts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold py-3 px-4 rounded-xl border border-zinc-800 text-sm transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 bg-[#FACC15] hover:bg-[#eab308] text-black font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-yellow-500/20 active:scale-[0.98]"
          >
            {isSubmitting ? 'Saving...' : 'Start Exploring'}
          </button>
        </div>
      </div>
    </div>
  );
};
