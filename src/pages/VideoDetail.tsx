
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MobileLayout from '@/components/layouts/MobileLayout';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/card';
import { fetchSupabaseVideoById } from '@/services/videoService';
import { useQuery } from '@tanstack/react-query';
import db from '@/data/database';

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [localVideo, setLocalVideo] = useState<any>(null);

  // First try to get the video from Supabase
  const { data: supabaseVideo, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['video', id],
    queryFn: () => fetchSupabaseVideoById(id!),
    enabled: !!id
  });

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
            setLocalVideo(video);
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
          <div className="flex justify-center items-center h-60">
            <p>Video not found</p>
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
