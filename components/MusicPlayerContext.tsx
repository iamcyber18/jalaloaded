'use client';

import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ISong } from '@/models/Song';

interface MusicPlayerContextType {
  currentTrack: ISong | null;
  queue: ISong[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
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
  closePlayer: () => void;
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
  const [volume, setVolumeState] = useState(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize global audio instance
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      const audio = new Audio();
      audio.volume = volume;

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration);
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        if (isRepeat) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          nextTrack();
        }
      };

      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playTrack = (track: ISong, newQueue?: ISong[]) => {
    setCurrentTrack(track);
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else if (!queue.some(t => t._id === track._id)) {
      setQueue(prev => [...prev, track]);
    }

    const audioUrl = track.streamUrl || track.mediaUrl || track.downloadUrl;
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        // Track play count asynchronously
        fetch(`/api/songs/${track._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'play' }),
        }).catch(() => {});
      }).catch(err => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t._id === currentTrack._id);
    if (idx === -1) return;

    let nextIdx = (idx + 1) % queue.length;
    if (isShuffle && queue.length > 1) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }
    playTrack(queue[nextIdx]);
  };

  const prevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 5) {
      audioRef.current.currentTime = 0;
      return;
    }
    const idx = queue.findIndex((t) => t._id === currentTrack._id);
    if (idx === -1) return;

    const prevIdx = (idx - 1 + queue.length) % queue.length;
    playTrack(queue[prevIdx]);
  };

  const seekTrack = (pct: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const targetTime = (pct / 100) * audioRef.current.duration;
      audioRef.current.currentTime = targetTime;
      setProgress(pct);
      setCurrentTime(targetTime);
    }
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        progress,
        duration,
        currentTime,
        isShuffle,
        isRepeat,
        volume,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTrack,
        toggleShuffle,
        toggleRepeat,
        setVolume,
        closePlayer,
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

