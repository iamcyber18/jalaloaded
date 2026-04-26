'use client';

import { useMusicPlayer } from './MusicPlayerContext';
import Image from 'next/image';
import { formatDuration } from '@/lib/utils';
import { useState } from 'react';

export default function MusicPlayer() {
  const { 
    currentTrack, isPlaying, progress, duration, isShuffle, isRepeat, volume,
    togglePlay, nextTrack, prevTrack, seekTrack, toggleShuffle, toggleRepeat, setVolume 
  } = useMusicPlayer();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.1)] z-50 px-4 py-2 flex items-center justify-between gap-4">
      {/* Track Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
        <div className="w-10 h-10 rounded overflow-hidden relative flex-shrink-0 bg-neutral-800">
           {currentTrack.coverUrl ? (
             <Image src={currentTrack.coverUrl} alt={currentTrack.title} fill className={`object-cover ${isPlaying ? 'animate-spin-slow' : ''}`} />
           ) : (
             <div className="w-full h-full bg-gradient-to-br from-[#FF6B00] to-[#c84b00]" />
           )}
        </div>
        <div className="min-w-0">
          <div className="text-white text-xs font-semibold font-syne truncate">{currentTrack.title}</div>
          <div className="text-white/50 text-[10px] truncate">{currentTrack.artist}</div>
        </div>
      </div>

      {/* Controls & Progress */}
      <div className="flex-1 max-w-2xl flex flex-col items-center">
        <div className="flex items-center gap-4 mb-1">
          <button onClick={toggleShuffle} className={`p-1 rounded transition-colors ${isShuffle ? 'text-orange-500' : 'text-white/50 hover:text-white/90'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
          </button>
          <button onClick={prevTrack} className="text-white/50 hover:text-white/90 p-1">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>
          <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center hover:bg-[#e05e00] transition-colors text-white">
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          <button onClick={nextTrack} className="text-white/50 hover:text-white/90 p-1">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>
          <button onClick={toggleRepeat} className={`p-1 rounded transition-colors ${isRepeat ? 'text-orange-500' : 'text-white/50 hover:text-white/90'}`}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          </button>
        </div>
        
        <div className="w-full flex items-center gap-2">
          <span className="text-[9px] text-white/40 w-6 text-right">
             {formatDuration((progress / 100) * duration)}
          </span>
          <div 
            className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative group"
            onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               seekTrack(((e.clientX - rect.left) / rect.width) * 100);
            }}
          >
            <div className="absolute top-0 left-0 h-full bg-[#FF6B00] rounded-full group-hover:bg-[#ff8533]" style={{ width: `${progress}%` }}>
               <div className="absolute right-[-4px] top-[-3px] w-[10px] h-[10px] bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-[9px] text-white/40 w-6">
             {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-end gap-2 w-1/4 min-w-[120px]">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
         <input 
           type="range" 
           min="0" max="1" step="0.01" value={volume}
           onChange={(e) => setVolume(parseFloat(e.target.value))}
           className="vol-slider w-16"
         />
      </div>
      
      {/* Hidden Audio Element - will play the actual source */}
      {/* <audio ref={audioRef} src={currentTrack.mediaUrl} /> */}
    </div>
  );
}
