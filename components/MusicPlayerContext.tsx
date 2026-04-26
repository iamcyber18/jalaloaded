'use client';

import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ISong } from '@/models/Song';

interface MusicPlayerContextType {
  currentTrack: ISong | null;
  queue: ISong[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  isShuffle: boolean;
  isRepeat: boolean;
  volume: number;
  playTrack: (track: ISong, newQueue?: ISong[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTrack: (progressPct: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (vol: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<ISong | null>(null);
  const [queue, setQueue] = useState<ISong[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [duration, setDuration] = useState(0); // in seconds
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolumeState] = useState(0.75);

  const audioRef = useRef<HTMLAudioElement | null>(null); // To be fully implemented when linking actual audio source

  // Placeholder logic for progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTrack) {
        // Simulate progress for UI purposes until real audio is attached
        interval = setInterval(() => {
            setCurrentTime(prev => {
                const nt = prev + 1;
                const d = currentTrack.duration || 200;
                setProgress((nt / d) * 100);
                if (nt >= d) {
                   if (isRepeat) return 0;
                   else {
                       // nextTrack(); // would call actual implementation
                       setIsPlaying(false);
                       return d;
                   }
                }
                return nt;
            })
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, isRepeat]);

  const playTrack = (track: ISong, newQueue?: ISong[]) => {
    setCurrentTrack(track);
    if (newQueue) setQueue(newQueue);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    // audio logic would go here
  };

  const togglePlay = () => {
    if (currentTrack) setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
     if (!currentTrack || queue.length === 0) return;
     const idx = queue.findIndex(t => t._id === currentTrack._id);
     if (idx === -1) return;
     
     let nextIdx = (idx + 1) % queue.length;
     if (isShuffle) {
         nextIdx = Math.floor(Math.random() * queue.length);
     }
     playTrack(queue[nextIdx]);
  };

  const prevTrack = () => {
     if (!currentTrack || queue.length === 0) return;
     if (progress > 10) {
         setProgress(0);
         setCurrentTime(0);
         return;
     }
     const idx = queue.findIndex(t => t._id === currentTrack._id);
     if (idx === -1) return;
     
     const prevIdx = (idx - 1 + queue.length) % queue.length;
     playTrack(queue[prevIdx]);
  };

  const seekTrack = (pct: number) => {
      setProgress(pct);
      if (currentTrack?.duration) {
          setCurrentTime((pct / 100) * currentTrack.duration);
      }
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);
  
  const setVolume = (vol: number) => {
      setVolumeState(vol);
      if (audioRef.current) audioRef.current.volume = vol;
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack, queue, isPlaying, progress, duration: currentTrack?.duration || 0,
        isShuffle, isRepeat, volume,
        playTrack, togglePlay, nextTrack, prevTrack, seekTrack, toggleShuffle, toggleRepeat, setVolume
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  return context;
};
