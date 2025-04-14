
import Dexie, { Table } from 'dexie';

export interface User {
  id?: number;
  username: string;
  password: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  educationDetails?: EducationDetail[];
  createdAt: Date;
}

export interface EducationDetail {
  id?: number;
  userId: number;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface DailyChallenge {
  id?: number;
  title: string;
  scenario: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  skillCategory: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
}

export interface UserProgress {
  id?: number;
  userId: number;
  challengeId: number;
  completed: boolean;
  selectedAnswer?: string;
  isCorrect?: boolean;
  completedAt: Date;
}

export interface VideoResource {
  id?: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  skillCategory: string[];
  localFilePath?: string; // for offline viewing
  isDownloaded: boolean;
  createdAt: Date;
}

export interface UserStreak {
  id?: number;
  userId: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date;
}

export class Elevate360Database extends Dexie {
  users!: Table<User, number>;
  educationDetails!: Table<EducationDetail, number>;
  dailyChallenges!: Table<DailyChallenge, number>;
  userProgress!: Table<UserProgress, number>;
  videoResources!: Table<VideoResource, number>;
  userStreaks!: Table<UserStreak, number>;

  constructor() {
    super('Elevate360DB');
    
    this.version(1).stores({
      users: '++id, username, email',
      educationDetails: '++id, userId',
      dailyChallenges: '++id, skillCategory, difficulty',
      userProgress: '++id, userId, challengeId, completedAt',
      videoResources: '++id, skillCategory, videoUrl',
      userStreaks: '++id, userId'
    });
  }
}

const db = new Elevate360Database();

// Call this function immediately when module is loaded
seedDatabaseWithInitialData().catch(error => 
  console.error("Failed to seed database:", error)
);

// Seed data function for development
export async function seedDatabaseWithInitialData() {
  try {
    console.log("Checking if database needs seeding...");
    
    // Only seed if challenges table is empty
    const challengeCount = await db.dailyChallenges.count();
    const videoCount = await db.videoResources.count();
    
    console.log(`Found ${challengeCount} challenges and ${videoCount} videos in database`);
    
    if (challengeCount === 0) {
      console.log("Seeding challenges...");
      // Seed challenges
      await db.dailyChallenges.bulkAdd([
        {
          title: "Resolving Team Conflict",
          scenario: "Two team members are arguing about the best approach to a project. The deadline is tomorrow. What do you do?",
          options: [
            "Let them figure it out on their own",
            "Make the decision for them to save time",
            "Facilitate a quick discussion to find common ground",
            "Escalate to management"
          ],
          correctAnswer: "Facilitate a quick discussion to find common ground",
          explanation: "Facilitating a discussion helps address the conflict while respecting both perspectives and promotes teamwork.",
          skillCategory: "conflict-resolution",
          difficulty: "intermediate",
          createdAt: new Date()
        },
        {
          title: "Active Listening",
          scenario: "A colleague is explaining a complex problem, but you're having trouble following. What's the best response?",
          options: [
            "Interrupt to clarify whenever you don't understand",
            "Nod and pretend to understand to be polite",
            "Take notes and ask clarifying questions after they finish their main points",
            "Tell them to simplify their explanation"
          ],
          correctAnswer: "Take notes and ask clarifying questions after they finish their main points",
          explanation: "Active listening involves letting the person complete their thoughts while noting questions, showing respect and gaining a fuller understanding.",
          skillCategory: "communication",
          difficulty: "beginner",
          createdAt: new Date()
        },
        {
          title: "Giving Feedback",
          scenario: "A team member's work doesn't meet expectations. How do you address this?",
          options: [
            "Send a detailed email listing all the issues",
            "Discuss it privately using specific examples and offering support",
            "Mention it casually during a team meeting to normalize feedback",
            "Fix their work yourself to avoid confrontation"
          ],
          correctAnswer: "Discuss it privately using specific examples and offering support",
          explanation: "Private, constructive feedback with specific examples and offered support maintains respect while addressing the issue directly.",
          skillCategory: "leadership",
          difficulty: "intermediate",
          createdAt: new Date()
        }
      ]);
      console.log("Challenges seeded successfully");
    }
    
    if (videoCount === 0) {
      console.log("Seeding video resources...");
      // Seed video resources
      await db.videoResources.bulkAdd([
        {
          title: "Mastering Emotional Intelligence",
          description: "Learn the four components of EI and how to apply them in workplace scenarios",
          videoUrl: "https://example.com/videos/emotional-intelligence",
          thumbnailUrl: "https://example.com/thumbnails/emotional-intelligence.jpg",
          duration: 843, // 14:03 minutes
          skillCategory: ["emotional-intelligence", "leadership"],
          isDownloaded: false,
          createdAt: new Date()
        },
        {
          title: "Effective Communication Techniques",
          description: "Practical techniques to improve clarity, empathy and impact in your communication",
          videoUrl: "https://example.com/videos/communication",
          thumbnailUrl: "https://example.com/thumbnails/communication.jpg",
          duration: 1105, // 18:25 minutes
          skillCategory: ["communication"],
          isDownloaded: false,
          createdAt: new Date()
        },
        {
          title: "Conflict Resolution Strategies",
          description: "Learn how to address and resolve conflicts in a constructive manner",
          videoUrl: "https://example.com/videos/conflict-resolution",
          thumbnailUrl: "https://example.com/thumbnails/conflict-resolution.jpg",
          duration: 957, // 15:57 minutes
          skillCategory: ["conflict-resolution", "teamwork"],
          isDownloaded: false,
          createdAt: new Date()
        }
      ]);
      console.log("Video resources seeded successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
}

export default db;
