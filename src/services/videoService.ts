
import { supabase } from "@/integrations/supabase/client";
import { VideoResource } from "@/data/database";
import db from "@/data/database";
import { toast } from "@/hooks/use-toast";

export interface SupabaseVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  duration: number;
  skill_categories: string[];
  created_at: string;
  updated_at: string;
}

export async function fetchSupabaseVideos(): Promise<SupabaseVideo[]> {
  console.log("Fetching videos from Supabase");
  
  try {
    const { data, error } = await supabase
      .from('video_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching videos from Supabase:", error);
      toast({
        title: "Unable to load videos",
        description: "Check your internet connection and try again",
        variant: "destructive"
      });
      throw error;
    }

    console.log("Successfully fetched videos from Supabase:", data?.length || 0);
    
    // If no videos found in Supabase, use fallback data
    if (!data || data.length === 0) {
      return getFallbackVideos();
    }
    
    return data;
  } catch (error) {
    console.error("Exception in fetchSupabaseVideos:", error);
    toast({
      title: "Unable to load videos",
      description: "Using local videos instead",
      variant: "default"
    });
    return getFallbackVideos();
  }
}

export async function fetchSupabaseVideoById(id: string): Promise<SupabaseVideo | null> {
  console.log("Fetching video from Supabase with ID:", id);
  
  try {
    const { data, error } = await supabase
      .from('video_resources')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching video by ID:", error);
      throw error;
    }

    console.log("Video fetch result:", data);
    
    // If not found in Supabase, check local videos
    if (!data) {
      const localVideo = await findLocalVideoById(parseInt(id));
      if (localVideo) {
        return convertLocalToSupabaseFormat(localVideo);
      }
    }
    
    return data;
  } catch (error) {
    console.error("Exception in fetchSupabaseVideoById:", error);
    
    // Try to get from local DB as fallback
    const localVideo = await findLocalVideoById(parseInt(id));
    if (localVideo) {
      return convertLocalToSupabaseFormat(localVideo);
    }
    
    throw error;
  }
}

export async function findLocalVideoById(id: number): Promise<VideoResource | undefined> {
  try {
    return await db.videoResources.get(id);
  } catch (error) {
    console.error("Error finding local video by ID:", error);
    return undefined;
  }
}

// Fix for the database videoUrl index error we saw in console logs
export async function findVideoByUrl(videoUrl: string): Promise<VideoResource | undefined> {
  try {
    const videos = await db.videoResources.where("videoUrl").equals(videoUrl).first();
    return videos;
  } catch (error) {
    console.error("Error finding video by URL:", error);
    return undefined;
  }
}

// Update the Dexie database schema to properly index videoUrl
export async function updateDexieSchema() {
  try {
    if (!db.videoResources.schema.primKey) {
      console.log("Updating database schema to include videoUrl index");
      await db.version(2).stores({
        videoResources: '++id, videoUrl, skillCategory, isDownloaded'
      });
      console.log("Database schema updated successfully");
    }
  } catch (error) {
    console.error("Error updating database schema:", error);
  }
}

// Convert a Supabase video to local database format
export function convertSupabaseVideoToLocal(video: SupabaseVideo): VideoResource {
  return {
    id: parseInt(video.id, 10) || Date.now(), // Fallback to timestamp if parsing fails
    title: video.title,
    description: video.description,
    videoUrl: video.video_url,
    thumbnailUrl: video.thumbnail_url || '',
    duration: video.duration,
    skillCategory: video.skill_categories,
    isDownloaded: false,
    createdAt: new Date(video.created_at)
  };
}

// Convert a local video to Supabase format for consistency
export function convertLocalToSupabaseFormat(video: VideoResource): SupabaseVideo {
  return {
    id: video.id?.toString() || Date.now().toString(),
    title: video.title,
    description: video.description,
    video_url: video.videoUrl,
    thumbnail_url: video.thumbnailUrl,
    duration: video.duration,
    skill_categories: Array.isArray(video.skillCategory) ? video.skillCategory : [video.skillCategory],
    created_at: video.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: video.createdAt?.toISOString() || new Date().toISOString()
  };
}

// Provide fallback videos when Supabase is unavailable
function getFallbackVideos(): SupabaseVideo[] {
  return [
    {
      id: "1",
      title: "Effective Communication (Offline)",
      description: "Learn how to communicate clearly and confidently in any situation",
      video_url: "/sample-videos/effective_communication.mp4",
      thumbnail_url: "/sample-videos/thumbnails/effective_communication.jpg",
      duration: 720,
      skill_categories: ["communication", "leadership"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "2",
      title: "Time Management Mastery (Offline)",
      description: "Strategies to manage your time efficiently and boost productivity",
      video_url: "/sample-videos/time_management.mp4",
      thumbnail_url: "/sample-videos/thumbnails/time_management.jpg", 
      duration: 540,
      skill_categories: ["productivity", "self-management"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "3",
      title: "Conflict Resolution (Offline)",
      description: "How to resolve workplace conflicts professionally",
      video_url: "/sample-videos/conflict_resolution.mp4",
      thumbnail_url: "/sample-videos/thumbnails/conflict_resolution.jpg",
      duration: 630,
      skill_categories: ["communication", "teamwork", "leadership"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}
