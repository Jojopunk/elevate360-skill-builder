
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video as VideoIcon, Download, CheckCircle } from 'lucide-react';
import { SupabaseVideo } from '@/services/videoService';
import { VideoResource } from '@/data/database';

interface VideoCardProps {
  video: SupabaseVideo | VideoResource;
  isDownloaded: boolean;
  onDownload: (video: any) => void;
  formatDuration: (seconds: number) => string;
  isSupabaseVideo: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  isDownloaded, 
  onDownload, 
  formatDuration,
  isSupabaseVideo
}) => {
  // Extract the right values based on whether it's a Supabase video or local video
  const title = video.title;
  const description = isSupabaseVideo 
    ? (video as SupabaseVideo).description 
    : (video as VideoResource).description;
  const duration = isSupabaseVideo 
    ? (video as SupabaseVideo).duration 
    : (video as VideoResource).duration;
  const categories = isSupabaseVideo 
    ? (video as SupabaseVideo).skill_categories 
    : (video as VideoResource).skillCategory;

  return (
    <Card className="card-shadow">
      <div className="relative">
        <div className="bg-gray-200 h-40 w-full rounded-t-lg flex items-center justify-center">
          <VideoIcon className="h-12 w-12 text-gray-500" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {formatDuration(duration)}
        </div>
        {!isSupabaseVideo && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Offline
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-600 mb-3">
          {description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category, index) => (
            <Badge key={index} variant="outline" className="capitalize">
              {typeof category === 'string' ? category.replace(/-/g, ' ') : category}
            </Badge>
          ))}
        </div>
        
        {isSupabaseVideo && (
          isDownloaded ? (
            <Button 
              variant="secondary" 
              size="sm"
              className="w-full"
              disabled
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Downloaded
            </Button>
          ) : (
            <Button 
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => onDownload(video)}
            >
              <Download className="h-4 w-4 mr-1" />
              Download for Offline
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default VideoCard;
