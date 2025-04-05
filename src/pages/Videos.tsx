
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video as VideoIcon, Search, Download, Clock, CheckCircle } from 'lucide-react';
import db, { VideoResource } from '@/data/database';

const Videos = () => {
  const [videos, setVideos] = useState<VideoResource[]>([]);
  const [downloadedVideos, setDownloadedVideos] = useState<VideoResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const allVideos = await db.videoResources.toArray();
        setVideos(allVideos);
        setDownloadedVideos(allVideos.filter(v => v.isDownloaded));
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, []);

  const handleDownload = async (videoId: number) => {
    try {
      // Simulate downloading by marking as downloaded
      await db.videoResources.update(videoId, {
        isDownloaded: true,
        // In a real app, you would also store the local file path
        localFilePath: `/local/videos/${videoId}.mp4`
      });
      
      // Refresh the video lists
      const updatedVideo = await db.videoResources.get(videoId);
      if (updatedVideo) {
        setVideos(prevVideos => 
          prevVideos.map(v => v.id === videoId ? updatedVideo : v)
        );
        setDownloadedVideos(prevDownloaded => [...prevDownloaded, updatedVideo]);
      }
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.skillCategory.some(cat => 
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <MobileLayout>
      <div className="flex flex-col p-4 bg-white min-h-screen">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-navy">Skill Videos</h1>
          <p className="text-gray-600">Learn from expert-curated content</p>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search videos..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all">All Videos</TabsTrigger>
            <TabsTrigger value="downloaded">Downloaded</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-center py-8 text-gray-600">Loading videos...</p>
              ) : filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <Card key={video.id} className="card-shadow">
                    <div className="relative">
                      <div className="bg-gray-200 h-40 w-full rounded-t-lg flex items-center justify-center">
                        <VideoIcon className="h-12 w-12 text-gray-500" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-600 mb-3">
                        {video.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {video.skillCategory.map((category) => (
                          <Badge key={category} variant="outline" className="capitalize">
                            {category.replace(/-/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        variant={video.isDownloaded ? "secondary" : "default"}
                        size="sm"
                        className="w-full"
                        disabled={video.isDownloaded}
                        onClick={() => video.id && handleDownload(video.id)}
                      >
                        {video.isDownloaded ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Downloaded
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download for Offline
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <VideoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-700">No videos found</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="downloaded">
            <div className="space-y-4">
              {downloadedVideos.length > 0 ? (
                downloadedVideos.map((video) => (
                  <Card key={video.id} className="card-shadow">
                    <div className="relative">
                      <div className="bg-gray-200 h-40 w-full rounded-t-lg flex items-center justify-center">
                        <VideoIcon className="h-12 w-12 text-gray-500" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Offline
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-600 mb-3">
                        {video.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {video.skillCategory.map((category) => (
                          <Badge key={category} variant="outline" className="capitalize">
                            {category.replace(/-/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Download className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-700">No Downloaded Videos</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Download videos to watch offline
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default Videos;
