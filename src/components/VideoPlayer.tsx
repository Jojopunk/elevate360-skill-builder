
import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useVideoPlayer } from '@/hooks/use-video-player';
import VideoControls from './video/VideoControls';
import VideoMetadata from './video/VideoMetadata';
import { isYoutubeUrl, extractYoutubeVideoId } from '@/services/videoService';
import { toast } from '@/hooks/use-toast';

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
  const [videoError, setVideoError] = useState<string | null>(null);
  
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

  // Log video details for debugging
  useEffect(() => {
    console.log('VideoPlayer mounted with URL:', videoUrl);
    console.log('Is YouTube:', isYouTube);
    console.log('YouTube Video ID:', youtubeVideoId);
    console.log('Title:', title);
    
    if (!isYouTube) {
      // Check if the URL starts with a slash and is not absolute
      if (videoUrl.startsWith('/') && !videoUrl.startsWith('//') && !videoUrl.match(/^\/[a-z]+:/i)) {
        // For local video files, make sure the path is correct
        console.log('Local video file detected');
        
        // Create an Image object to test if the path is accessible
        const img = new Image();
        img.onload = () => console.log('Path seems accessible (thumbnail test)');
        img.onerror = () => console.log('Path might not be accessible (thumbnail test failed)');
        
        if (categories && categories.length > 0) {
          // Try to load a thumbnail using the same path pattern
          const category = categories[0].toLowerCase().replace(/-/g, '');
          img.src = `/videos/thumbnails/${category}.jpg`;
        }
      } else {
        console.log('External video file or absolute URL detected');
      }
    }

    return () => {
      console.log('VideoPlayer unmounting');
    };
  }, [videoUrl, isYouTube, youtubeVideoId, title, categories]);

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
    const videoElem = e.currentTarget;
    const errorMsg = `Failed to load video. Error code: ${videoElem.error?.code || 'unknown'}`;
    
    setVideoError(errorMsg);
    setError(errorMsg);
    setIsLoading(false);
    
    // Log details about the video element
    console.error("Video error details:", {
      src: videoElem.currentSrc || videoElem.src,
      readyState: videoElem.readyState,
      networkState: videoElem.networkState,
      error: videoElem.error
    });
    
    toast({
      title: "Video playback error",
      description: "There was a problem loading the video. Check console for details.",
      variant: "destructive"
    });
  };

  const retryLoading = () => {
    setError(null);
    setVideoError(null);
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

        {(error || videoError) && !isYouTube && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
            <div className="text-white text-center p-4">
              <p className="mb-2">{error || videoError}</p>
              <div className="mb-2">
                <p className="text-xs opacity-70">Video URL: {videoUrl}</p>
              </div>
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
