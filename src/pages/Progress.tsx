import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/layouts/MobileLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, CheckCircle2, BarChart2, AlertTriangle, BookOpen } from 'lucide-react';
import db from '@/data/database';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

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

interface SuggestionItem {
  category: string;
  message: string;
  icon: React.ReactNode;
}

const Progress = () => {
  const { currentUser } = useAuth();
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0
  });
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
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
        const progressByCategory: Record<string, { completed: number; correct: number, total: number }> = {};
        
        // Initialize with all categories from challenges
        challenges.forEach(challenge => {
          const category = challenge.skillCategory;
          if (!progressByCategory[category]) {
            progressByCategory[category] = { completed: 0, correct: 0, total: 0 };
          }
          progressByCategory[category].total += 1;
        });
        
        // Update with user progress
        for (const entry of progress) {
          const challenge = await db.dailyChallenges.get(entry.challengeId);
          if (challenge) {
            const category = challenge.skillCategory;
            if (!progressByCategory[category]) {
              progressByCategory[category] = { completed: 0, correct: 0, total: 0 };
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
        
        // Calculate overall progress
        const totalCorrect = progressArray.reduce((sum, skill) => sum + skill.correct, 0);
        const totalCompleted = progressArray.reduce((sum, skill) => sum + skill.completed, 0);
        const calculatedOverall = totalCompleted > 0 
          ? Math.round((totalCorrect / totalCompleted) * 100)
          : 0;
        setOverallProgress(calculatedOverall);
        
        // Generate personalized suggestions
        const newSuggestions: SuggestionItem[] = [];
        
        // Find categories with lower percentages
        const lowPerformingSkills = progressArray
          .filter(skill => skill.completed > 0 && skill.percentage < 70)
          .sort((a, b) => a.percentage - b.percentage);
          
        // Find categories with no activity
        const noActivitySkills = progressArray
          .filter(skill => skill.completed === 0);
        
        // Add suggestions for low performing skills
        if (lowPerformingSkills.length > 0) {
          const worstSkill = lowPerformingSkills[0];
          newSuggestions.push({
            category: worstSkill.category,
            message: `Focus on improving your ${formatCategoryName(worstSkill.category)} skills. Your current mastery is only ${worstSkill.percentage}%.`,
            icon: <AlertTriangle className="h-5 w-5 text-amber-500" />
          });
        }
        
        // Add suggestions for no activity skills
        if (noActivitySkills.length > 0) {
          const skill = noActivitySkills[0];
          newSuggestions.push({
            category: skill.category,
            message: `Try completing challenges in ${formatCategoryName(skill.category)} to expand your skillset.`,
            icon: <BookOpen className="h-5 w-5 text-blue-500" />
          });
        }
        
        // Add encouragement if doing well
        if (overallProgress >= 80) {
          newSuggestions.push({
            category: "overall",
            message: `Great work! Your overall performance is excellent at ${overallProgress}%.`,
            icon: <Trophy className="h-5 w-5 text-yellow-500" />
          });
        }
        
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error loading progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [currentUser]);

  const formatCategoryName = (category: string): string => {
    return category.replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const chartData = skillProgress.map(skill => ({
    name: formatCategoryName(skill.category),
    value: skill.percentage,
    category: skill.category
  }));

  return (
    <MobileLayout>
      <div className="flex flex-col p-4 bg-white min-h-screen">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Your Progress</h1>
          <p className="text-gray-600">Track your skill development journey</p>
        </header>

        <Card className="card-shadow mb-6">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart2 className="h-5 w-5 text-purple-500 mr-2" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium">Mastery</span>
              <span className="text-sm font-medium">{overallProgress}%</span>
            </div>
            <ProgressBar value={overallProgress} className="h-2 bg-gray-200" />
          </CardContent>
        </Card>

        {suggestions.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-lg font-semibold">Personalized Suggestions</h2>
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="card-shadow bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{suggestion.icon}</div>
                    <p className="text-sm">{suggestion.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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

              {/* Skill Performance Chart */}
              <Card className="card-shadow">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart2 className="h-5 w-5 text-purple-500 mr-2" />
                    Skill Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-64">
                    {chartData.length > 0 ? (
                      <ChartContainer 
                        config={{
                          skill: { color: "#9b87f5" },
                          threshold: { color: "#F97316" }
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                            <XAxis 
                              dataKey="name" 
                              fontSize={12}
                              tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                            />
                            <YAxis hide domain={[0, 100]} />
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="value" fill="#9b87f5" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.value < 60 ? '#F97316' : '#9b87f5'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">Complete challenges to see your skill performance</p>
                      </div>
                    )}
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
                        {formatCategoryName(skill.category)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Mastery</span>
                          <span className="text-sm font-medium">{skill.percentage}%</span>
                        </div>
                        <ProgressBar 
                          value={skill.percentage} 
                          className="h-2"
                          style={{ 
                            backgroundColor: '#E5DEFF',
                            '--tw-bg-opacity': 1,
                          }}
                        />
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
