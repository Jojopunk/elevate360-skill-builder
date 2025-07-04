
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MobileLayout from '@/components/layouts/MobileLayout';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { fetchSupabaseVideoById, getFallbackVideos } from '@/services/videoService';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import db from '@/data/database';

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [localVideo, setLocalVideo] = useState<any>(null);

  // Check if the ID starts with "yt-" which indicates it's a YouTube video from fallback
  const isYouTubeVideo = id?.startsWith('yt-');

  // First try to get the video from Supabase, but skip for YouTube fallback videos
  const { data: supabaseVideo, isLoading: isLoadingSupabase, error } = useQuery({
    queryKey: ['video', id],
    queryFn: () => fetchSupabaseVideoById(id!),
    enabled: !!id && !isYouTubeVideo, // Don't query Supabase for YouTube fallback videos
    retry: 1, // Only retry once to avoid multiple fallbacks to local
    meta: {
      onError: (err: any) => {
        console.error("Error fetching video from Supabase:", err);
        toast({
          title: "Falling back to local videos",
          description: "Could not load from server. Checking local storage...",
          variant: "default"
        });
      }
    }
  });

  // For YouTube videos, get them directly from the fallback list
  const [fallbackVideo, setFallbackVideo] = useState<any>(null);

  useEffect(() => {
    if (isYouTubeVideo) {
      const fallbackVideos = getFallbackVideos();
      const video = fallbackVideos.find(v => v.id === id);
      if (video) {
        console.log("Found YouTube video in fallbacks:", video);
        setFallbackVideo(video);
      } else {
        console.error("YouTube video not found in fallbacks:", id);
      }
    }
  }, [id, isYouTubeVideo]);

  // Log debugging information
  useEffect(() => {
    console.log("Video Detail Page - ID:", id);
    console.log("Is YouTube video:", isYouTubeVideo);
    console.log("Supabase video:", supabaseVideo);
    console.log("Fallback video:", fallbackVideo);
    console.log("Local video:", localVideo);
    console.log("Is loading from Supabase:", isLoadingSupabase);
    
    if (error) {
      console.error("Detailed Supabase error:", error);
    }
  }, [id, isYouTubeVideo, supabaseVideo, fallbackVideo, localVideo, isLoadingSupabase, error]);

  // If not found in Supabase or as YouTube fallback, try to get from local DB
  useEffect(() => {
    const getLocalVideo = async () => {
      if (!id) return;
      
      try {
        console.log("Trying to find video in local database with ID:", id);
        
        // Try to parse as number for local DB
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          const video = await db.videoResources.get(numId);
          if (video) {
            console.log("Local video found by ID:", video);
            setLocalVideo(video);
          } else {
            console.log("No local video found with ID:", numId);
            
            // If not found by ID, try to find all videos and debug
            const allVideos = await db.videoResources.toArray();
            console.log("All local videos:", allVideos);
          }
        } else {
          // If it's not a number, try finding by videoUrl (for Supabase videos saved locally)
          const allVideos = await db.videoResources.toArray();
          console.log("All local videos:", allVideos);
          
          const matchingVideo = allVideos.find(v => 
            v.videoUrl && (
              v.videoUrl.includes(id) || 
              (typeof v.id === 'string' && v.id === id)
            )
          );
          
          if (matchingVideo) {
            console.log("Local video found by URL or ID match:", matchingVideo);
            setLocalVideo(matchingVideo);
          } else {
            console.log("No local video found matching ID in URL:", id);
          }
        }
      } catch (error) {
        console.error('Error fetching local video:', error);
      }
    };

    if (!supabaseVideo && !isLoadingSupabase && !fallbackVideo) {
      getLocalVideo();
    }
  }, [id, supabaseVideo, isLoadingSupabase, fallbackVideo]);

  // Determine which video to use (fallback, supabase, or local)
  const video = fallbackVideo || supabaseVideo || localVideo;
  const isLoading = (isLoadingSupabase && !isYouTubeVideo && !localVideo && !fallbackVideo);

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
            <Button onClick={() => navigate('/videos')}>
              Browse Videos
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Handle different property structures between different video sources
  const videoUrl = 'video_url' in video ? video.video_url : video.videoUrl;
  const title = video.title;
  const description = 'description' in video ? video.description : video.description;
  const categories = 'skill_categories' in video ? video.skill_categories : video.skillCategory;

  console.log("Rendering VideoPlayer with URL:", videoUrl);
  console.log("Full video object:", video);

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
          categories={categories || []}
        />
      </div>
    </MobileLayout>
  );
}

export default VideoDetail;
