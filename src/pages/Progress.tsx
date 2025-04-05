
import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/layouts/MobileLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, CheckCircle2, BarChart2 } from 'lucide-react';
import db from '@/data/database';

interface SkillProgress {
  category: string;
  completed: number;
  correct: number;
  percentage: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

const Progress = () => {
  const { currentUser } = useAuth();
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      
      try {
        // Get user streak
        const streak = await db.userStreaks
          .where('userId').equals(currentUser.id!)
          .first();
        
        if (streak) {
          setStreakData({
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak
          });
        }

        // Get user progress
        const progress = await db.userProgress
          .where('userId').equals(currentUser.id!)
          .toArray();
        
        setCompletedCount(progress.length);

        // Get all challenges for skill categories
        const challenges = await db.dailyChallenges.toArray();
        
        // Calculate progress by skill category
        const progressByCategory: Record<string, { completed: number; correct: number }> = {};
        
        // Initialize with all categories from challenges
        challenges.forEach(challenge => {
          if (!progressByCategory[challenge.skillCategory]) {
            progressByCategory[challenge.skillCategory] = { completed: 0, correct: 0 };
          }
        });
        
        // Update with user progress
        for (const entry of progress) {
          const challenge = await db.dailyChallenges.get(entry.challengeId);
          if (challenge) {
            const category = challenge.skillCategory;
            if (!progressByCategory[category]) {
              progressByCategory[category] = { completed: 0, correct: 0 };
            }
            progressByCategory[category].completed += 1;
            if (entry.isCorrect) {
              progressByCategory[category].correct += 1;
            }
          }
        }
        
        // Convert to array for display
        const progressArray = Object.entries(progressByCategory).map(([category, data]) => ({
          category,
          completed: data.completed,
          correct: data.correct,
          percentage: data.completed > 0 ? Math.round((data.correct / data.completed) * 100) : 0
        }));
        
        setSkillProgress(progressArray);
      } catch (error) {
        console.error('Error loading progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [currentUser]);

  return (
    <MobileLayout>
      <div className="flex flex-col p-4 bg-white min-h-screen">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Your Progress</h1>
          <p className="text-gray-600">Track your skill development journey</p>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="space-y-4">
              <Card className="card-shadow">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                    Streak
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current</p>
                      <p className="text-2xl font-bold">{streakData.currentStreak} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Longest</p>
                      <p className="text-2xl font-bold">{streakData.longestStreak} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    Challenges Completed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-3xl font-bold">{completedCount}</p>
                  <p className="text-sm text-gray-600">Total challenges completed</p>
                </CardContent>
              </Card>

              {/* Placeholder for a chart */}
              <Card className="card-shadow">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 text-navy mr-2" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-32 bg-gray-100 rounded-md flex items-center justify-center">
                    <p className="text-gray-500">Activity data visualization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="skills">
            <div className="space-y-4">
              {skillProgress.length > 0 ? (
                skillProgress.map((skill) => (
                  <Card key={skill.category} className="card-shadow">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg capitalize">
                        {skill.category.replace(/-/g, ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Mastery</span>
                          <span className="text-sm font-medium">{skill.percentage}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-value" 
                            style={{ width: `${skill.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Completed: {skill.completed}</span>
                        <span>Correct: {skill.correct}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-700">No Skills Data Yet</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Complete challenges to see your skill progress
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

export default Progress;
