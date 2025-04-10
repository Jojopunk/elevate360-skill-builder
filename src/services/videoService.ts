
import { supabase } from "@/integrations/supabase/client";
import { VideoResource } from "@/data/database";

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
  const { data, error } = await supabase
    .from('video_resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching videos from Supabase:", error);
    throw error;
  }

  return data || [];
}

export async function fetchSupabaseVideoById(id: string): Promise<SupabaseVideo | null> {
  const { data, error } = await supabase
    .from('video_resources')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching video by ID:", error);
    return null;
  }

  return data;
}

// Convert a Supabase video to local database format (if needed)
export function convertSupabaseVideoToLocal(video: SupabaseVideo): VideoResource {
  return {
    id: parseInt(video.id, 10), // This might need adjustment based on your ID format
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
