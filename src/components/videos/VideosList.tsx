
import React from 'react';
import { VideoIcon, Download } from 'lucide-react';
import VideoCard from './VideoCard';
import { SupabaseVideo } from '@/services/videoService';
import { VideoResource } from '@/data/database';
import { Link } from 'react-router-dom';

interface VideosListProps {
  isLoadingSupabase?: boolean;
  supabaseError?: unknown;
  filteredVideos: (SupabaseVideo | VideoResource)[];
  localVideos: VideoResource[];
  handleDownload: (video: SupabaseVideo) => void;
  formatDuration: (seconds: number) => string;
  isDownloadedTab?: boolean;
}

const VideosList: React.FC<VideosListProps> = ({
  isLoadingSupabase,
  supabaseError,
  filteredVideos,
  localVideos,
  handleDownload,
  formatDuration,
  isDownloadedTab = false
}) => {
  if (isLoadingSupabase && !isDownloadedTab) {
    return <p className="text-center py-8 text-gray-600">Loading videos...</p>;
  }
  
  if (supabaseError && !isDownloadedTab) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load videos</p>
        <p className="text-sm text-gray-500 mt-2">Please check your connection and try again</p>
      </div>
    );
  }
  
  if (filteredVideos.length === 0) {
    return (
      <div className="text-center py-8">
        {isDownloadedTab ? (
          <>
            <Download className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-700">No Downloaded Videos</h3>
            <p className="text-gray-500 text-sm mt-1">
              Download videos to watch offline
            </p>
          </>
        ) : (
          <>
            <VideoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-700">No videos found</h3>
            <p className="text-gray-500 text-sm mt-1">
              Try a different search term
            </p>
          </>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredVideos.map((video, index) => {
        // Determine if this is a Supabase video by checking for video_url property
        const isSupabaseVideo = 'video_url' in video;
        
        // Check if this video is already downloaded (only relevant for Supabase videos)
        const isDownloaded = isSupabaseVideo 
          ? localVideos.some(lv => lv.videoUrl === (video as SupabaseVideo).video_url && lv.isDownloaded)
          : (video as VideoResource).isDownloaded;
        
        // Determine the video ID for the link
        const videoId = isSupabaseVideo 
          ? (video as SupabaseVideo).id 
          : (video as VideoResource).id;
        
        return (
          <Link 
            to={`/videos/${videoId}`} 
            key={isSupabaseVideo ? (video as SupabaseVideo).id : `local-${index}`}
            className="block"
          >
            <VideoCard
              video={video}
              isDownloaded={isDownloaded}
              onDownload={(e) => {
                e.preventDefault(); // Prevent navigation when clicking download
                if (isSupabaseVideo) handleDownload(video as SupabaseVideo);
              }}
              formatDuration={formatDuration}
              isSupabaseVideo={isSupabaseVideo}
            />
          </Link>
        );
      })}
    </div>
  );
};

export default VideosList;
