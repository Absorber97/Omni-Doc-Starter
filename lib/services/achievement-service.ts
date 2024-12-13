import { v4 as uuidv4 } from 'uuid';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export class AchievementService {
  private static achievements: Record<string, Achievement> = {};

  static awardAchievement(title: string, description: string, icon: string): Achievement {
    const achievement = {
      id: uuidv4(),
      title,
      description,
      icon,
      earnedAt: new Date()
    };

    this.achievements[achievement.id] = achievement;
    
    // Log achievement for debugging
    console.log('🏆 Achievement unlocked:', {
      title,
      description,
      icon,
      timestamp: achievement.earnedAt
    });

    return achievement;
  }

  static getAchievements(): Achievement[] {
    return Object.values(this.achievements);
  }

  static hasAchievement(id: string): boolean {
    return id in this.achievements;
  }

  static clearAchievements(): void {
    this.achievements = {};
  }
} 