
import React from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onSeek: (seconds: number) => void;
  formatTime: (time: number) => string;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  onPlayPause,
  onMuteToggle,
  onSeek,
  formatTime,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white hover:text-white hover:bg-white/20"
          onClick={onPlayPause}
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
            onClick={() => onSeek(-10)}
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:text-white hover:bg-white/20"
            onClick={() => onSeek(10)}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:text-white hover:bg-white/20"
            onClick={onMuteToggle}
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
  );
};

export default VideoControls;
