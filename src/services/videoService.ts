
import { supabase } from "@/integrations/supabase/client";
import { VideoResource } from "@/data/database";
import db from "@/data/database";

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
  
  const { data, error } = await supabase
    .from('video_resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching videos from Supabase:", error);
    throw error;
  }

  console.log("Successfully fetched videos from Supabase:", data?.length || 0);
  return data || [];
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
    return data;
  } catch (error) {
    console.error("Exception in fetchSupabaseVideoById:", error);
    return null;
  }
}

// Fix for the database videoUrl index error we saw in console logs
export async function findVideoByUrl(videoUrl: string): Promise<VideoResource | undefined> {
  try {
    const videos = await db.videoResources.toArray();
    return videos.find(v => v.videoUrl === videoUrl);
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
