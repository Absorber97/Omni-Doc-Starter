import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MCQAchievement } from '@/lib/store/mcq-store';
import { Trophy, Lock, Sparkles, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MCQAchievementsProps {
  achievements: MCQAchievement[];
}

const achievementColors = [
  'from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40',
  'from-blue-500/30 to-cyan-500/30 hover:from-blue-500/40 hover:to-cyan-500/40',
  'from-green-500/30 to-emerald-500/30 hover:from-green-500/40 hover:to-emerald-500/40',
  'from-yellow-500/30 to-orange-500/30 hover:from-yellow-500/40 hover:to-orange-500/40',
  'from-red-500/30 to-rose-500/30 hover:from-red-500/40 hover:to-rose-500/40'
];

const flipVariants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export function MCQAchievements({ achievements }: MCQAchievementsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setFlippedId(flippedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-2 group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-left">Achievements</h3>
            <p className="text-sm text-muted-foreground">
              {achievements.filter(a => a.isUnlocked).length} of {achievements.length} unlocked
            </p>
          </div>
        </div>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isExpanded ? "transform rotate-180" : ""
          )} 
        />
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-8 p-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={false}
                  animate={achievement.isUnlocked ? {
                    scale: 1,
                    opacity: 1,
                  } : {
                    scale: 1,
                    opacity: 0.6,
                  }}
                  className="aspect-square perspective-1000"
                >
                  <motion.div
                    className="relative w-full h-full preserve-3d cursor-pointer"
                    animate={flippedId === achievement.id ? "back" : "front"}
                    variants={flipVariants}
                    onClick={() => handleClick(achievement.id)}
                  >
                    {/* Front of card */}
                    <Card 
                      className={cn(
                        "absolute inset-0 backface-hidden",
                        "transition-all duration-300",
                        "bg-gradient-to-br",
                        achievementColors[index % achievementColors.length],
                        achievement.isUnlocked && [
                          "ring-2 ring-primary/30",
                          "shadow-lg shadow-primary/20",
                          "animate-glow"
                        ],
                        "hover:shadow-xl hover:-translate-y-0.5",
                        "flex flex-col items-center justify-center gap-4 p-4"
                      )}
                    >
                      {/* Achievement Icon */}
                      <div className={cn(
                        "relative w-16 h-16 rounded-2xl",
                        "flex items-center justify-center",
                        "bg-background/50 backdrop-blur-sm",
                        "transition-transform hover:scale-110",
                        achievement.isUnlocked ? [
                          "shadow-xl",
                          "bg-primary/10",
                          "ring-1 ring-primary/20"
                        ] : "grayscale"
                      )}>
                        <span className="text-4xl">{achievement.emoji}</span>
                        {!achievement.isUnlocked && (
                          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        {achievement.isUnlocked && (
                          <motion.div
                            className="absolute -top-1 -right-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          </motion.div>
                        )}
                      </div>

                      {/* Achievement Name */}
                      <div className="text-center">
                        <div className={cn(
                          "font-medium text-sm leading-snug",
                          achievement.isUnlocked && "text-primary"
                        )}>
                          {achievement.name}
                        </div>
                      </div>

                      {/* Glow Effect for unlocked achievements */}
                      {achievement.isUnlocked && (
                        <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-lg pointer-events-none" />
                      )}
                    </Card>

                    {/* Back of card */}
                    <Card 
                      className={cn(
                        "absolute inset-0 backface-hidden rotateY-180",
                        "transition-all duration-300",
                        "bg-gradient-to-br",
                        achievementColors[index % achievementColors.length],
                        achievement.isUnlocked && [
                          "ring-2 ring-primary/30",
                          "shadow-lg shadow-primary/20"
                        ],
                        "hover:shadow-xl",
                        "flex flex-col items-center justify-center p-4 text-center"
                      )}
                    >
                      {achievement.isUnlocked ? (
                        <>
                          <div className="font-medium mb-2 text-primary">
                            🎉 Unlocked!
                          </div>
                          <div className="text-sm text-primary/80">
                            {new Date(achievement.unlockedAt!).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Question {index + 1}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Complete Question {index + 1} to unlock
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 