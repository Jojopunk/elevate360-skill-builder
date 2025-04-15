
import React, { useState } from 'react';
import MobileLayout from '@/components/layouts/MobileLayout';
import { useChallenge } from '@/context/ChallengeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
import { seedDatabaseWithInitialData } from '@/data/database';

const Learn = () => {
  const { toast } = useToast();
  const { 
    dailyChallenge, 
    isLoading, 
    userAnswer,
    submitAnswer,
    hasCompletedDailyChallenge,
    loadNextChallenge
  } = useChallenge();
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleOptionSelect = (option: string) => {
    if (userAnswer || submitting) return;
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!selectedOption || userAnswer || submitting) return;

    setSubmitting(true);
    const result = await submitAnswer(selectedOption);
    setIsCorrect(result);
    setShowExplanation(true);
    setSubmitting(false);
    
    if (result) {
      toast({
        title: "Correct!",
        description: "Great job on solving this scenario!",
      });
    } else {
      toast({
        title: "Keep Learning",
        description: "Review the explanation to understand the best approach.",
        variant: "destructive"
      });
    }
  };

  const handleNextChallenge = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setIsCorrect(null);
    loadNextChallenge();
  };

  const handleRefreshDatabase = async () => {
    setRefreshing(true);
    try {
      await seedDatabaseWithInitialData();
      toast({
        title: "Database Refreshed",
        description: "Challenge database has been refreshed. Loading new challenge...",
      });
      await loadNextChallenge();
    } catch (error) {
      console.error("Error refreshing database:", error);
      toast({
        title: "Error",
        description: "Failed to refresh the database. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
          <Loader2 className="h-8 w-8 text-navy animate-spin mb-4" />
          <p className="text-navy">Loading your challenge...</p>
        </div>
      </MobileLayout>
    );
  }

  if (hasCompletedDailyChallenge && !dailyChallenge) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">All Done for Today!</h1>
          <p className="text-gray-600 text-center mb-6">
            You've completed today's challenge. Come back tomorrow for a new one!
          </p>
          <Button className="bg-navy hover:bg-navy-dark" onClick={handleNextChallenge}>
            Try Another Challenge Anyway
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (!dailyChallenge) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
          <div className="bg-yellow-100 rounded-full p-4 mb-4">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">No Challenges Available</h1>
          <p className="text-gray-600 text-center mb-6">
            We couldn't find any challenges right now. This might be because the database hasn't been properly initialized.
          </p>
          
          <Button 
            onClick={handleRefreshDatabase}
            disabled={refreshing}
            className="bg-navy hover:bg-navy-dark flex items-center gap-2 mb-4"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing Database...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh Challenge Database
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            If problems persist, try clearing your browser cache or restarting the application.
          </p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col p-4 bg-white min-h-screen">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-navy">Daily Challenge</h1>
          <p className="text-gray-600">Develop your {dailyChallenge.skillCategory} skills</p>
        </header>

        <Card className="mb-6 card-shadow">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <span className="bg-navy/10 text-navy text-xs px-2 py-1 rounded-full">
                {dailyChallenge.skillCategory}
              </span>
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                {dailyChallenge.difficulty}
              </span>
            </div>
            <CardTitle>{dailyChallenge.title}</CardTitle>
            <CardDescription>
              Scenario: {dailyChallenge.scenario}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyChallenge.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full p-3 text-left rounded-md border transition-colors ${
                    selectedOption === option
                      ? "border-navy bg-navy/10"
                      : "border-gray-200 hover:border-navy/30"
                  } ${
                    userAnswer
                      ? option === dailyChallenge.correctAnswer
                        ? "border-green-500 bg-green-50"
                        : option === userAnswer && option !== dailyChallenge.correctAnswer
                        ? "border-red-500 bg-red-50"
                        : ""
                      : ""
                  } ${
                    userAnswer && option !== selectedOption && option !== dailyChallenge.correctAnswer
                      ? "opacity-50"
                      : ""
                  }`}
                  disabled={!!userAnswer}
                >
                  <p className="text-sm">{option}</p>
                </button>
              ))}
            </div>

            {showExplanation && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-start mb-2">
                  <HelpCircle className="h-5 w-5 text-navy mr-2 mt-0.5" />
                  <h3 className="font-medium">Explanation</h3>
                </div>
                <p className="text-sm text-gray-700">{dailyChallenge.explanation}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={handleRefreshDatabase}
              disabled={refreshing || submitting}
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            
            {!userAnswer ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption || submitting}
                className="bg-navy hover:bg-navy-dark"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Answer"
                )}
              </Button>
            ) : (
              <Button onClick={handleNextChallenge} className="bg-navy hover:bg-navy-dark">
                Next Challenge
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Learn;
