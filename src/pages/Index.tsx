
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MobileLayout from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Trophy, Calendar, BookOpen, CheckCircle2 } from 'lucide-react';
import { seedDatabaseWithInitialData } from '@/data/database';

const Index = () => {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  // Seed the database with initial data on first load
  useEffect(() => {
    seedDatabaseWithInitialData();
  }, []);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, isLoading, navigate]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Elevate360</h1>
          <p className="text-gray-600">Loading your personal development journey...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col px-4 py-6 bg-white min-h-screen">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Welcome, {currentUser.fullName.split(' ')[0]}</h1>
          <p className="text-gray-600">Let's enhance your skills today</p>
        </header>

        <Card className="mb-6 card-shadow">
          <CardHeader className="bg-navy text-white rounded-t-lg">
            <CardTitle>Daily Challenge</CardTitle>
            <CardDescription className="text-gray-200">
              Build your skills with daily scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-navy/10 p-3 rounded-full mr-4">
                <BookOpen className="h-6 w-6 text-navy" />
              </div>
              <div>
                <h3 className="font-medium">Today's Scenario</h3>
                <p className="text-sm text-gray-600">
                  Test your soft skills with a real-world scenario
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={() => navigate('/learn')} 
              className="bg-navy hover:bg-navy-dark"
            >
              Start Challenge <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="card-shadow">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">Streak</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold">0</span>
                <span className="ml-2 text-gray-600">days</span>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">Completed</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mr-2" />
                <span className="text-2xl font-bold">0</span>
                <span className="ml-2 text-gray-600">challenges</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-shadow mb-6">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">Recent Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Communication</span>
                <div className="progress-bar mt-1">
                  <div className="progress-value" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Leadership</span>
                <div className="progress-bar mt-1">
                  <div className="progress-value" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Conflict Resolution</span>
                <div className="progress-bar mt-1">
                  <div className="progress-value" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => navigate('/progress')}
              className="text-navy border-navy hover:bg-navy/10"
            >
              View Details
            </Button>
          </CardFooter>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">Recommended Videos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center">
              <div className="bg-gray-200 rounded-md w-20 h-12 mr-3 flex items-center justify-center">
                <Video className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Effective Communication</h4>
                <p className="text-xs text-gray-600">18:25 • Communication</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => navigate('/videos')}
              className="text-navy border-navy hover:bg-navy/10"
            >
              See All Videos
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Index;
