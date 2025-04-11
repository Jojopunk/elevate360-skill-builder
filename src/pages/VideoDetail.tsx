
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MobileLayout from '@/components/layouts/MobileLayout';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { fetchSupabaseVideoById } from '@/services/videoService';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import db from '@/data/database';

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [localVideo, setLocalVideo] = useState<any>(null);

  // First try to get the video from Supabase
  const { data: supabaseVideo, isLoading: isLoadingSupabase, error } = useQuery({
    queryKey: ['video', id],
    queryFn: () => fetchSupabaseVideoById(id!),
    enabled: !!id,
    retry: 1, // Only retry once to avoid multiple fallbacks to local
  });

  // Log for debugging
  useEffect(() => {
    if (error) {
      console.error("Error fetching video from Supabase:", error);
      toast({
        title: "Error loading video",
        description: "Could not load the video from the server. Checking local storage...",
        variant: "destructive"
      });
    }
    
    if (supabaseVideo) {
      console.log("Supabase video loaded:", supabaseVideo);
    }
  }, [supabaseVideo, error]);

  // If not found in Supabase, try to get from local DB
  useEffect(() => {
    const getLocalVideo = async () => {
      if (!id) return;
      
      try {
        // Try to parse as number for local DB
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          const video = await db.videoResources.get(numId);
          if (video) {
            console.log("Local video loaded:", video);
            setLocalVideo(video);
          } else {
            console.log("No local video found with ID:", numId);
          }
        } else {
          // If it's not a number, try finding by videoUrl (for Supabase videos saved locally)
          const allVideos = await db.videoResources.toArray();
          const matchingVideo = allVideos.find(v => 
            v.videoUrl && v.videoUrl.includes(id)
          );
          
          if (matchingVideo) {
            console.log("Local video found by URL match:", matchingVideo);
            setLocalVideo(matchingVideo);
          } else {
            console.log("No local video found matching ID in URL:", id);
          }
        }
      } catch (error) {
        console.error('Error fetching local video:', error);
      }
    };

    if (!supabaseVideo) {
      getLocalVideo();
    }
  }, [id, supabaseVideo]);

  const video = supabaseVideo || localVideo;
  const isLoading = isLoadingSupabase && !localVideo;

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <Button className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex justify-center items-center h-60">
            <p>Loading video...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!video) {
    return (
      <MobileLayout>
        <div className="p-4">
          <Button className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex justify-center items-center h-60 flex-col gap-2">
            <p className="text-red-500">Video not found</p>
            <p className="text-sm text-gray-500">The requested video could not be found</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Handle different property structures between Supabase and local DB
  const videoUrl = supabaseVideo ? supabaseVideo.video_url : video.videoUrl;
  const title = video.title;
  const description = supabaseVideo ? supabaseVideo.description : video.description;
  const categories = supabaseVideo ? supabaseVideo.skill_categories : video.skillCategory;

  return (
    <MobileLayout>
      <div className="p-4">
        <Button className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <VideoPlayer 
          videoUrl={videoUrl} 
          title={title} 
          description={description}
          categories={categories}
        />
      </div>
    </MobileLayout>
  );
}

export default VideoDetail;
