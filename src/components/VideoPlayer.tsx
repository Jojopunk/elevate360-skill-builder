
import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useVideoPlayer } from '@/hooks/use-video-player';
import VideoControls from './video/VideoControls';
import VideoMetadata from './video/VideoMetadata';
import { isYoutubeUrl, extractYoutubeVideoId } from '@/services/videoService';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  description?: string;
  categories?: string[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  title, 
  description,
  categories 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
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
    setIsPlaying,
    togglePlay,
    toggleMute,
    seek,
    formatTime
  } = useVideoPlayer(videoRef);

  // Check if this is a YouTube video
  const isYouTube = isYoutubeUrl(videoUrl);
  const youtubeVideoId = isYouTube ? extractYoutubeVideoId(videoUrl) : null;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      console.log("Video metadata loaded. Duration:", videoRef.current.duration);
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video failed to load:", e);
    setError("Failed to load video. Please check your connection or try a different video.");
    setIsLoading(false);
  };

  const retryLoading = () => {
    setError(null);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Stop loading spinner for YouTube videos
  useEffect(() => {
    if (isYouTube) {
      setIsLoading(false);
    }
  }, [isYouTube, setIsLoading]);

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {isLoading && !isYouTube && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <div className="text-white">Loading video...</div>
          </div>
        )}

        {error && !isYouTube && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="text-white text-center p-4">
              <p className="mb-2">{error}</p>
              <Button 
                variant="outline" 
                onClick={retryLoading}
                className="mr-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {isYouTube && youtubeVideoId ? (
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-auto"
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              controls={false}
              preload="metadata"
              playsInline
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <VideoControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              currentTime={currentTime}
              duration={duration}
              onPlayPause={togglePlay}
              onMuteToggle={toggleMute}
              onSeek={seek}
              formatTime={formatTime}
            />
          </>
        )}
      </div>

      <VideoMetadata
        title={title}
        description={description}
        categories={categories}
      />
    </Card>
  );
};

export default VideoPlayer;
