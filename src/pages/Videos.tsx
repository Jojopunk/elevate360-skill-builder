
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import db, { VideoResource } from '@/data/database';
import { fetchSupabaseVideos, SupabaseVideo } from '@/services/videoService';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/videos/SearchBar';
import VideosList from '@/components/videos/VideosList';

const Videos = () => {
  const [localVideos, setLocalVideos] = useState<VideoResource[]>([]);
  const [downloadedVideos, setDownloadedVideos] = useState<VideoResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch videos from Supabase
  const { data: supabaseVideos, isLoading: isLoadingSupabase, error: supabaseError } = useQuery({
    queryKey: ['videos'],
    queryFn: fetchSupabaseVideos
  });

  // Fetch locally stored videos
  useEffect(() => {
    const loadLocalVideos = async () => {
      try {
        const allVideos = await db.videoResources.toArray();
        setLocalVideos(allVideos);
        setDownloadedVideos(allVideos.filter(v => v.isDownloaded));
      } catch (error) {
        console.error('Error loading local videos:', error);
      }
    };

    loadLocalVideos();
  }, []);

  const handleDownload = async (video: SupabaseVideo) => {
    try {
      // First check if we already have this video in our local DB
      const existingVideo = await db.videoResources
        .where({ videoUrl: video.video_url })
        .first();
      
      if (existingVideo) {
        // Update existing record to mark as downloaded
        await db.videoResources.update(existingVideo.id!, {
          isDownloaded: true,
          localFilePath: `/local/videos/${video.id}.mp4`
        });
      } else {
        // Add new record to local DB
        await db.videoResources.add({
          title: video.title,
          description: video.description,
          videoUrl: video.video_url,
          thumbnailUrl: video.thumbnail_url || '',
          duration: video.duration,
          skillCategory: video.skill_categories,
          isDownloaded: true,
          localFilePath: `/local/videos/${video.id}.mp4`,
          createdAt: new Date(video.created_at)
        });
      }
      
      // Refresh the video lists
      const updatedLocalVideos = await db.videoResources.toArray();
      setLocalVideos(updatedLocalVideos);
      setDownloadedVideos(updatedLocalVideos.filter(v => v.isDownloaded));

      toast({
        title: "Video Downloaded",
        description: `${video.title} is now available offline`,
      });
      
    } catch (error) {
      console.error('Error downloading video:', error);
      toast({
        title: "Download Failed",
        description: "There was a problem downloading this video",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const filteredSupabaseVideos = supabaseVideos?.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.skill_categories.some(cat => 
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <MobileLayout>
      <div className="flex flex-col p-4 bg-white min-h-screen">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-navy">Skill Videos</h1>
          <p className="text-gray-600">Learn from expert-curated soft skill content</p>
        </header>

        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all">All Videos</TabsTrigger>
            <TabsTrigger value="downloaded">Downloaded</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <VideosList 
              isLoadingSupabase={isLoadingSupabase}
              supabaseError={supabaseError}
              filteredVideos={filteredSupabaseVideos || []}
              localVideos={localVideos}
              handleDownload={handleDownload}
              formatDuration={formatDuration}
            />
          </TabsContent>
          
          <TabsContent value="downloaded">
            <VideosList 
              filteredVideos={downloadedVideos}
              localVideos={localVideos}
              handleDownload={handleDownload}
              formatDuration={formatDuration}
              isDownloadedTab={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default Videos;
