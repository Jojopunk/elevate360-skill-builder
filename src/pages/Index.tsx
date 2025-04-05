import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, BarChart2, Video as VideoIcon, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChallenge } from '@/context/ChallengeContext';
import MobileLayout from '@/components/layouts/MobileLayout';
import db, { VideoResource, UserProgress, DailyChallenge } from '@/data/database';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentChallenge, markChallengeAsCompleted } = useChallenge();
  const [featuredVideos, setFeaturedVideos] = useState<VideoResource[]>([]);
  const [completedChallengesCount, setCompletedChallengesCount] = useState(0);

  useEffect(() => {
    const loadFeaturedVideos = async () => {
      try {
        const videos = await db.videoResources.toArray();
        setFeaturedVideos(videos.slice(0, 3));
      } catch (error) {
        console.error('Error loading featured videos:', error);
      }
    };

    const loadCompletedChallengesCount = async () => {
      if (user) {
        try {
          const count = await db.userProgress
            .where({ userId: user.id, completed: true })
            .count();
          setCompletedChallengesCount(count);
        } catch (error) {
          console.error('Error loading completed challenges count:', error);
        }
      }
    };

    loadFeaturedVideos();
    loadCompletedChallengesCount();
  }, [user]);

  const handleCompleteChallenge = async () => {
    if (currentChallenge && user) {
      try {
        await markChallengeAsCompleted(currentChallenge.id);
        setCompletedChallengesCount(prevCount => prevCount + 1);
      } catch (error) {
        console.error('Error completing challenge:', error);
      }
    }
  };

  const renderHeroSection = () => (
    <section className="mb-6">
      <div className="bg-navy text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome, {user?.fullName || 'Guest'}!
        </h2>
        <p className="text-gray-200">
          Ready to elevate your skills? Let's get started!
        </p>
      </div>
    </section>
  );

  const renderQuickActions = () => (
    <section className="mb-6">
      <h3 className="text-lg font-bold mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <Card className="card-shadow">
          <CardContent className="flex items-center space-x-4 p-4">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <div>
              <CardTitle className="text-sm font-semibold">Learn</CardTitle>
              <Button variant="link" size="sm" onClick={() => navigate('/learn')}>
                Start Learning <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="flex items-center space-x-4 p-4">
            <BarChart2 className="h-6 w-6 text-green-500" />
            <div>
              <CardTitle className="text-sm font-semibold">Track Progress</CardTitle>
              <Button variant="link" size="sm" onClick={() => navigate('/progress')}>
                View Progress <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );

  const renderDailyChallenge = () => (
    <Card className="mb-6 card-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Daily Challenge</CardTitle>
          {completedChallengesCount > 0 && (
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-600">{completedChallengesCount} Completed</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {currentChallenge ? (
          <>
            <h4 className="font-medium text-sm">{currentChallenge.title}</h4>
            <p className="text-xs text-gray-500 mb-3 line-clamp-3">{currentChallenge.scenario}</p>
            <Button className="w-full" onClick={handleCompleteChallenge}>
              Complete Challenge
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-500">No challenge available today. Check back tomorrow!</p>
        )}
      </CardContent>
    </Card>
  );

  const renderFeaturedVideos = () => (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Featured Videos</CardTitle>
          <Button 
            variant="ghost" 
            className="text-navy p-0 h-8" 
            onClick={() => navigate('/videos')}
          >
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {featuredVideos.map((video) => (
            <div key={video.id} className="flex gap-3 items-center">
              <div className="bg-gray-200 h-16 w-24 rounded-md flex items-center justify-center flex-shrink-0">
                <VideoIcon className="h-6 w-6 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{video.title}</h4>
                <p className="text-xs text-gray-500 truncate">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MobileLayout>
      <div className="flex flex-col p-4 bg-white min-h-screen">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-gray-600">Your skill development journey starts here</p>
        </header>

        {renderHeroSection()}
        {renderQuickActions()}
        {renderDailyChallenge()}
        {renderFeaturedVideos()}
      </div>
    </MobileLayout>
  );
};

export default Index;
