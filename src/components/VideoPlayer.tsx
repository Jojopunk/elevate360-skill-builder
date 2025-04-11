
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualVideoUrl, setActualVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getActualVideoUrl = async () => {
      try {
        console.log("Processing video URL:", videoUrl);
        
        if (!videoUrl) {
          console.error("No video URL provided");
          throw new Error("No video URL provided");
        }
        
        if (videoUrl.startsWith('/local/')) {
          console.log("Using local file:", videoUrl);
          setActualVideoUrl(videoUrl);
          return;
        }
        
        if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
          console.log("Using remote URL:", videoUrl);
          setActualVideoUrl(videoUrl);
          return;
        }
        
        // Handle Supabase storage path
        console.log("Getting public URL for Supabase storage path:", videoUrl);
        
        // Clean up path if needed (remove leading slashes)
        const cleanPath = videoUrl.startsWith('/') ? videoUrl.substring(1) : videoUrl;
        
        try {
          const { data } = await supabase.storage
            .from('skill_videos')
            .getPublicUrl(cleanPath);
            
          if (data?.publicUrl) {
            console.log("Got public URL:", data.publicUrl);
            setActualVideoUrl(data.publicUrl);
          } else {
            console.error("Failed to get public URL, no data returned");
            throw new Error("Failed to get public URL");
          }
        } catch (storageError) {
          console.error("Storage error:", storageError);
          throw storageError;
        }
      } catch (err) {
        console.error("Error processing video URL:", err);
        setError("Could not load video source");
        
        // Use fallback video
        const demoVideoUrl = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
        console.log("Using fallback demo video:", demoVideoUrl);
        setActualVideoUrl(demoVideoUrl);
        
        toast({
          title: "Video Error",
          description: "Could not load the requested video. Using a demo video instead.",
          variant: "destructive"
        });
      }
    };
    
    getActualVideoUrl();
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current && actualVideoUrl) {
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
      setError(null);
      
      videoRef.current.load();
      
      console.log("Video source changed to:", actualVideoUrl);
    }
  }, [actualVideoUrl]);

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
    toast({
      title: "Video Error",
      description: "Unable to load the video. Please try again later.",
      variant: "destructive"
    });
  };

  const retryLoading = () => {
    setError(null);
    if (videoRef.current) {
      videoRef.current.load();
      console.log("Retrying video load for:", actualVideoUrl);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <div className="text-white">Loading video...</div>
          </div>
        )}

        {error && (
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
          {actualVideoUrl && <source src={actualVideoUrl} type="video/mp4" />}
          Your browser does not support the video tag.
        </video>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => seek(-10)}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => seek(10)}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          <Progress
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            className="h-1 mt-2"
          />
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        {description && <p className="text-gray-600 mb-3">{description}</p>}
        
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Badge key={index} variant="outline" className="capitalize">
                {typeof category === 'string' ? category.replace(/-/g, ' ') : category}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default VideoPlayer;
