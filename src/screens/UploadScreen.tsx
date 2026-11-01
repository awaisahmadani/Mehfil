import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import {
  UploadCloud,
  Image as ImageIcon,
  Video,
  Globe,
  Users,
  Lock,
  Music,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

interface UploadScreenProps {
  onSuccess: () => void;
}

const SAMPLE_MEDIA_PRESETS = [
  {
    type: 'video' as const,
    name: 'Neon Lights Reels',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80',
  },
  {
    type: 'photo' as const,
    name: 'Chai & Poetry',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    type: 'photo' as const,
    name: 'Northern Peaks',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&auto=format&fit=crop&q=80',
  },
];

const SUGGESTED_HASHTAGS = [
  '#MehfilMoments',
  '#CokeStudioVibes',
  '#DesiAesthetic',
  '#KarachiDiaries',
  '#LahoreVibes',
  '#UrduShayari',
];

export const UploadScreen: React.FC<UploadScreenProps> = ({ onSuccess }) => {
  const { createPost } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<'photo' | 'video'>('photo');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>(['#MehfilMoments']);
  const [tagInput, setTagInput] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [musicTitle, setMusicTitle] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVid = file.type.startsWith('video');
      setPostType(isVid ? 'video' : 'photo');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHashtag = (tagToAdd: string) => {
    let clean = tagToAdd.trim();
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (!hashtags.includes(clean)) {
      setHashtags([...hashtags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return;

    setIsPosting(true);
    createPost({
      type: postType,
      mediaUrl,
      caption: caption.trim(),
      hashtags,
      visibility,
      musicTitle: postType === 'video' ? musicTitle.trim() : undefined,
    });

    setIsPosting(false);
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-[#FACC15]" />
          Create New Post
        </h2>
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setPostType('photo')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              postType === 'photo' ? 'bg-[#FACC15] text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photo
          </button>
          <button
            type="button"
            onClick={() => setPostType('video')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              postType === 'video' ? 'bg-[#FACC15] text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Reel
          </button>
        </div>
      </div>

      {showSuccessBanner && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Post shared to your Mehfil successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Media Upload & Preview Area */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300">
            Upload {postType === 'video' ? 'Video Reel' : 'Photo'}
          </label>

          {mediaUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-700 group">
              {postType === 'video' ? (
                <video src={mediaUrl} controls className="w-full h-full object-cover" />
              ) : (
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => setMediaUrl('')}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-[#FACC15] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-950/60 flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-[#FACC15]">
                {postType === 'video' ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200">
                  Click to browse and upload from your device
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Supports MP4, WebM, PNG, JPG, WebP
                </p>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={postType === 'video' ? 'video/*' : 'image/*'}
            className="hidden"
          />

          {/* Quick presets picker */}
          <div className="pt-1">
            <span className="text-[11px] text-zinc-400">Or choose high-res preset:</span>
            <div className="flex gap-2 mt-1.5 overflow-x-auto no-scrollbar">
              {SAMPLE_MEDIA_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPostType(preset.type);
                    setMediaUrl(preset.url);
                  }}
                  className="flex items-center gap-2 p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs shrink-0 transition-colors"
                >
                  <img src={preset.thumb} alt={preset.name} className="w-7 h-7 rounded-lg object-cover" />
                  <span className="text-zinc-300 pr-1">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">Caption</label>
          <textarea
            rows={3}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write an engaging caption for your Mehfil audience..."
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-xl p-3 resize-none"
          />
        </div>

        {/* Music / Sound Title (for Video Reels) */}
        {postType === 'video' && (
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#FACC15]" />
              Audio Track / Song Title
            </label>
            <input
              type="text"
              value={musicTitle}
              onChange={e => setMusicTitle(e.target.value)}
              placeholder="e.g. Tu Jhoom • Unplugged Acoustic"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-xl py-2.5 px-3"
            />
          </div>
        )}

        {/* Hashtags */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">Hashtags</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (tagInput.trim()) handleAddHashtag(tagInput);
                }
              }}
              placeholder="Type tag and press enter (e.g. #DesiBeats)"
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-[#FACC15] focus:outline-none text-white text-xs rounded-xl py-2 px-3"
            />
            <button
              type="button"
              onClick={() => tagInput.trim() && handleAddHashtag(tagInput)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-2 rounded-xl transition-colors"
            >
              Add
            </button>
          </div>

          {/* Active Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {hashtags.map(tag => (
              <span
                key={tag}
                className="bg-zinc-900 border border-[#FACC15]/30 text-[#FACC15] text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveHashtag(tag)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Suggested tags chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_HASHTAGS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleAddHashtag(t)}
                className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 px-2 py-0.5 rounded-md"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>

        {/* Audience Visibility */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">Audience Visibility</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                visibility === 'public'
                  ? 'border-[#FACC15] bg-yellow-950/30 text-[#FACC15]'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[11px] font-bold">Public</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('followers')}
              className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                visibility === 'followers'
                  ? 'border-[#FACC15] bg-yellow-950/30 text-[#FACC15]'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-bold">Followers</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                visibility === 'private'
                  ? 'border-[#FACC15] bg-yellow-950/30 text-[#FACC15]'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span className="text-[11px] font-bold">Only Me</span>
            </button>
          </div>
        </div>

        {/* Publish Button */}
        <button
          type="submit"
          disabled={!mediaUrl || isPosting}
          className="w-full mt-3 bg-[#FACC15] hover:bg-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-yellow-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {isPosting ? 'Publishing...' : 'Share to Mehfil'}
        </button>
      </form>
    </div>
  );
};
