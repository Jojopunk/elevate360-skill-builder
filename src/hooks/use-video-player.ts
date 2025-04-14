
import { useState, useEffect, RefObject } from 'react';
import { toast } from '@/hooks/use-toast';

export const useVideoPlayer = (videoRef: RefObject<HTMLVideoElement>) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.error("Error playing video:", err);
            setError("Failed to play video. This may be due to autoplay restrictions or format issues.");
            toast({
              title: "Playback Error",
              description: "Could not start video playback. Try clicking play again.",
              variant: "destructive"
            });
          });
        }
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime + seconds;
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, videoRef.current.duration));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return {
    isPlaying,
    isMuted,
    currentTime,
    duration,
    isLoading,
    error,
    setCurrentTime,
    setDuration,
    setIsLoading,
    setError,
    togglePlay,
    toggleMute,
    seek,
    formatTime
  };
};
