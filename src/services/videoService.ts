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

// Extract YouTube video ID from a YouTube URL
export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Match patterns like: 
  // https://www.youtube.com/watch?v=QGHBq5OEsBM
  // https://youtu.be/QGHBq5OEsBM
  // https://youtube.com/watch?v=QGHBq5OEsBM
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  
  console.log("YouTube URL parsing:", { url, match: match ? match[1] : null });
  return match ? match[1] : null;
}

// Get YouTube thumbnail URL from video ID
export function getYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Check if a URL is a YouTube video URL
export function isYoutubeUrl(url: string): boolean {
  const isYT = url.includes("youtube.com") || url.includes("youtu.be");
  console.log(`Checking if ${url} is a YouTube URL:`, isYT);
  return isYT;
}

// Fix Supabase video URL paths
export function fixVideoUrl(url: string): string {
  if (isYoutubeUrl(url) || url.startsWith('http')) {
    return url;
  }
  
  // If the URL starts with /skill_videos, adjust it to /videos
  if (url.startsWith('/skill_videos/')) {
    return url.replace('/skill_videos/', '/videos/');
  }
  
  return url;
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
    
    // Fix video URLs
    const fixedData = data.map(video => ({
      ...video,
      video_url: fixVideoUrl(video.video_url),
      thumbnail_url: video.thumbnail_url ? fixVideoUrl(video.thumbnail_url) : null
    }));
    
    return fixedData;
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
    
    // Fix video URLs if found
    if (data) {
      data.video_url = fixVideoUrl(data.video_url);
      if (data.thumbnail_url) {
        data.thumbnail_url = fixVideoUrl(data.thumbnail_url);
      }
    }
    
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

// Add YouTube video to Supabase
export async function addYoutubeVideoToSupabase(youtubeUrl: string, title: string, description: string, categories: string[]): Promise<SupabaseVideo | null> {
  try {
    const videoId = extractYoutubeVideoId(youtubeUrl);
    
    if (!videoId) {
      toast({
        title: "Invalid YouTube URL",
        description: "Could not extract video ID from the provided URL",
        variant: "destructive"
      });
      return null;
    }
    
    const thumbnailUrl = getYoutubeThumbnailUrl(videoId);
    
    // Create a new video record in Supabase
    const { data, error } = await supabase
      .from('video_resources')
      .insert([
        {
          title: title,
          description: description,
          video_url: youtubeUrl,
          thumbnail_url: thumbnailUrl,
          duration: 0, // We don't know the duration yet
          skill_categories: categories
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error("Error adding YouTube video to Supabase:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Exception in addYoutubeVideoToSupabase:", error);
    toast({
      title: "Failed to add video",
      description: "There was a problem adding this YouTube video",
      variant: "destructive"
    });
    return null;
  }
}

// Provide fallback videos when Supabase is unavailable
function getFallbackVideos(): SupabaseVideo[] {
  const fallbackVideos = [
    {
      id: "1",
      title: "Effective Communication (Offline)",
      description: "Learn how to communicate clearly and confidently in any situation",
      video_url: "/videos/effective_communication.mp4",
      thumbnail_url: "/videos/thumbnails/effective_communication.jpg",
      duration: 720,
      skill_categories: ["communication", "leadership"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "2",
      title: "Time Management Mastery (Offline)",
      description: "Strategies to manage your time efficiently and boost productivity",
      video_url: "/videos/time_management.mp4",
      thumbnail_url: "/videos/thumbnails/time_management.jpg", 
      duration: 540,
      skill_categories: ["productivity", "self-management"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "3",
      title: "Conflict Resolution (Offline)",
      description: "How to resolve workplace conflicts professionally",
      video_url: "/videos/conflict_resolution.mp4",
      thumbnail_url: "/videos/thumbnails/conflict_resolution.jpg",
      duration: 630,
      skill_categories: ["communication", "teamwork", "leadership"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "4",
      title: "Introduction to Web Development",
      description: "Learn the basics of HTML, CSS and JavaScript",
      video_url: "https://www.youtube.com/watch?v=QGHBq5OEsBM",
      thumbnail_url: getYoutubeThumbnailUrl("QGHBq5OEsBM"),
      duration: 600,
      skill_categories: ["coding", "web-development"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "5",
      title: "UX/UI Design Principles",
      description: "Learn essential design principles for creating great user experiences",
      video_url: "https://www.youtube.com/watch?v=I6IAhXM-vps",
      thumbnail_url: getYoutubeThumbnailUrl("I6IAhXM-vps"),
      duration: 920,
      skill_categories: ["design", "ux-ui"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "6",
      title: "Digital Marketing Fundamentals",
      description: "Comprehensive guide to digital marketing strategies and implementation",
      video_url: "https://www.youtube.com/watch?v=xgp6eELYY1M",
      thumbnail_url: getYoutubeThumbnailUrl("xgp6eELYY1M"),
      duration: 1150,
      skill_categories: ["marketing", "digital-skills"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "7",
      title: "Data Analysis for Beginners",
      description: "Introduction to data analysis techniques and tools for business insights",
      video_url: "https://www.youtube.com/watch?v=KY5TWVz5ZDU",
      thumbnail_url: getYoutubeThumbnailUrl("KY5TWVz5ZDU"),
      duration: 845,
      skill_categories: ["data-analysis", "business-skills"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  return fallbackVideos;
}
