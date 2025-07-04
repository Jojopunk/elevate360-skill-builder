
import React, { createContext, useContext, useState, useEffect } from 'react';
import db, { DailyChallenge, UserProgress, seedDatabaseWithInitialData } from '../data/database';
import { useAuth } from './AuthContext';
import { toast } from '../components/ui/use-toast';

interface ChallengeContextType {
  dailyChallenge: DailyChallenge | null;
  isLoading: boolean;
  userAnswer: string | null;
  submitAnswer: (answer: string) => Promise<boolean>;
  loadNextChallenge: () => Promise<void>;
  hasCompletedDailyChallenge: boolean;
  resetDailyChallenge: () => void;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [hasCompletedDailyChallenge, setHasCompletedDailyChallenge] = useState<boolean>(false);

  const getToday = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };
  
  const checkDailyCompletion = async () => {
    if (!currentUser) return;
    
    const today = getToday();
    const todayStart = today;
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    try {
      // Find any challenges completed today
      const completedToday = await db.userProgress
        .where('userId').equals(currentUser.id!)
        .and(progress => {
          const completionDate = new Date(progress.completedAt);
          return completionDate >= todayStart && completionDate <= todayEnd;
        })
        .toArray();
      
      setHasCompletedDailyChallenge(completedToday.length > 0);
    } catch (error) {
      console.error("Error checking daily completion:", error);
      setHasCompletedDailyChallenge(false);
    }
  };

  const updateUserStreak = async () => {
    if (!currentUser) return;
    
    try {
      const userStreak = await db.userStreaks
        .where('userId').equals(currentUser.id!)
        .first();
      
      if (!userStreak) return;
      
      const today = getToday();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastCompletedDate = new Date(userStreak.lastCompletedDate);
      lastCompletedDate.setHours(0, 0, 0, 0);
      
      let newStreak = userStreak.currentStreak;
      
      // Check if this is a continuation of the streak
      if (lastCompletedDate.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } 
      // Check if the streak was broken (more than a day since last completion)
      else if (lastCompletedDate.getTime() < yesterday.getTime()) {
        newStreak = 1; // Reset streak
      }
      // If completed already today, don't change the streak
      
      await db.userStreaks.update(userStreak.id!, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, userStreak.longestStreak),
        lastCompletedDate: today
      });
    } catch (error) {
      console.error("Error updating user streak:", error);
    }
  };

  const loadDailyChallenge = async () => {
    try {
      setIsLoading(true);
      
      // Make sure database is seeded
      await seedDatabaseWithInitialData();
      
      // Check if user has completed today's challenge
      await checkDailyCompletion();
      
      // Get all challenges
      const allChallenges = await db.dailyChallenges.toArray();
      console.log("Available challenges:", allChallenges.length);
      
      if (allChallenges.length === 0) {
        console.log("No challenges found in database. Attempting to re-seed...");
        await seedDatabaseWithInitialData();
        const recheckChallenges = await db.dailyChallenges.toArray();
        console.log("After re-seeding, found challenges:", recheckChallenges.length);
        
        if (recheckChallenges.length === 0) {
          setDailyChallenge(null);
          setIsLoading(false);
          toast({
            title: "No Challenges Available",
            description: "Please check back later for new challenges.",
            variant: "destructive"
          });
          return;
        }
      }
      
      let challenge: DailyChallenge | undefined;
      
      // If user hasn't completed a challenge today, get a random one
      if (!hasCompletedDailyChallenge) {
        // If user is logged in, try to find a challenge they haven't done
        if (currentUser) {
          const completedChallengeIds = await db.userProgress
            .where('userId').equals(currentUser.id!)
            .toArray()
            .then(progress => progress.map(p => p.challengeId));
          
          const uncompletedChallenges = allChallenges.filter(
            challenge => !completedChallengeIds.includes(challenge.id!)
          );
          
          if (uncompletedChallenges.length > 0) {
            // Get a random uncompleted challenge
            const randomIndex = Math.floor(Math.random() * uncompletedChallenges.length);
            challenge = uncompletedChallenges[randomIndex];
          }
        }
        
        // If no specific challenge found, just get a random one
        if (!challenge && allChallenges.length > 0) {
          const randomIndex = Math.floor(Math.random() * allChallenges.length);
          challenge = allChallenges[randomIndex];
        }
        
        console.log("Selected challenge:", challenge);
        setDailyChallenge(challenge || null);
      }
    } catch (error) {
      console.error('Error loading daily challenge:', error);
      toast({
        title: "Error",
        description: "Failed to load daily challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDailyChallenge();
  }, [currentUser]);

  const submitAnswer = async (answer: string): Promise<boolean> => {
    if (!dailyChallenge || !currentUser) return false;
    
    try {
      setUserAnswer(answer);
      const isCorrect = answer === dailyChallenge.correctAnswer;
      
      // Save progress
      await db.userProgress.add({
        userId: currentUser.id!,
        challengeId: dailyChallenge.id!,
        completed: true,
        selectedAnswer: answer,
        isCorrect,
        completedAt: new Date()
      });
      
      // Update user streak
      await updateUserStreak();
      
      // Update challenge completion status
      setHasCompletedDailyChallenge(true);
      
      return isCorrect;
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const loadNextChallenge = async () => {
    setUserAnswer(null);
    await loadDailyChallenge();
  };

  const resetDailyChallenge = () => {
    setUserAnswer(null);
    setDailyChallenge(null);
    setHasCompletedDailyChallenge(false);
  };

  const value = {
    dailyChallenge,
    isLoading,
    userAnswer,
    submitAnswer,
    loadNextChallenge,
    hasCompletedDailyChallenge,
    resetDailyChallenge
  };

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
};

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (context === undefined) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};
