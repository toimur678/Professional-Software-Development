'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Target, 
  Zap,
  Car,
  Utensils,
  Leaf,
  Users,
  Clock,
  Trophy,
  CheckCircle2,
  Play,
  Calendar,
  TrendingUp,
  Loader2,
  AlertCircle,
  Flame,
  Award
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  category: string;
  challenge_type: string;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string;
  points_reward: number;
  difficulty: string;
  participants_count: number;
  user_progress: number | null;
  user_completed: boolean | null;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'transport':
      return Car;
    case 'diet':
      return Utensils;
    case 'energy':
      return Zap;
    default:
      return Leaf;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'transport':
      return 'text-blue-600 bg-blue-100';
    case 'diet':
      return 'text-emerald-600 bg-emerald-100';
    case 'energy':
      return 'text-amber-600 bg-amber-100';
    default:
      return 'text-green-600 bg-green-100';
  }
};

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'hard':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'extreme':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getTimeRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  
  if (diff < 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

function ChallengeCard({ 
  challenge, 
  onJoin 
}: { 
  challenge: Challenge; 
  onJoin: (id: string) => void;
}) {
  const Icon = getCategoryIcon(challenge.category);
  const colorClass = getCategoryColor(challenge.category);
  const difficultyClass = getDifficultyBadge(challenge.difficulty);
  const isJoined = challenge.user_progress !== null;
  const progress = isJoined && challenge.user_progress !== null
    ? (challenge.user_progress / challenge.target_value) * 100
    : 0;
  
  return (
    <Card className={cn(
      "hover:shadow-lg transition-all",
      challenge.user_completed && "bg-green-50 border-green-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            {challenge.challenge_type === 'team' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Users className="h-3 w-3" /> Team
              </span>
            )}
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full border capitalize",
              difficultyClass
            )}>
              {challenge.difficulty}
            </span>
          </div>
        </div>
        
        <CardTitle className="text-lg mt-3 flex items-center gap-2">
          {challenge.title}
          {challenge.user_completed && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </CardTitle>
        <CardDescription>{challenge.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress (if joined) */}
        {isJoined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium">
                {challenge.user_progress} / {challenge.target_value} {challenge.target_unit.replace(/_/g, ' ')}
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>
        )}
        
        {/* Challenge Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4" />
            {getTimeRemaining(challenge.end_date)}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="h-4 w-4" />
            {challenge.participants_count} joined
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Target className="h-4 w-4" />
            {challenge.target_value} {challenge.target_unit.replace(/_/g, ' ')}
          </div>
          <div className="flex items-center gap-2 text-amber-600 font-medium">
            <Trophy className="h-4 w-4" />
            +{challenge.points_reward} pts
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        {challenge.user_completed ? (
          <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
            <Award className="h-4 w-4 mr-2" />
            Completed!
          </Button>
        ) : isJoined ? (
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Update Progress
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={() => onJoin(challenge.id)}
          >
            <Play className="h-4 w-4 mr-2" />
            Join Challenge
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function ChallengesPage() {
  const [tab, setTab] = useState('active');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChallenges() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/challenges?status=${tab}`);
        if (!response.ok) throw new Error('Failed to fetch challenges');
        const data = await response.json();
        setChallenges(data.challenges);
      } catch (err) {
        console.error('Challenges fetch error:', err);
        setError('Failed to load challenges. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchChallenges();
  }, [tab]);

  const handleJoinChallenge = async (challengeId: string) => {
    setJoiningId(challengeId);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/challenges/${challengeId}/join`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to join challenge');
      
      // Update local state
      setChallenges(prev => prev.map(c => 
        c.id === challengeId 
          ? { ...c, user_progress: 0, participants_count: c.participants_count + 1 }
          : c
      ));
    } catch (err) {
      console.error('Join challenge error:', err);
      setError('Failed to join challenge. Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  const activeChallenges = challenges.filter(c => !c.user_completed);
  const completedChallenges = challenges.filter(c => c.user_completed);
  const myChallenges = challenges.filter(c => c.user_progress !== null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Challenges <Flame className="h-8 w-8 text-orange-500" />
        </h2>
        <p className="text-slate-500 mt-1">
          Take on eco-challenges and earn rewards
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-3xl font-bold">{myChallenges.length}</p>
                <p className="text-sm opacity-80">Active Challenges</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedChallenges.length}</p>
                <p className="text-sm text-slate-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {completedChallenges.reduce((sum, c) => sum + c.points_reward, 0)}
                </p>
                <p className="text-sm text-slate-500">Points Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{challenges.length}</p>
                <p className="text-sm text-slate-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="active">All Challenges</TabsTrigger>
          <TabsTrigger value="my">My Challenges</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500 gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={challenge}
                  onJoin={handleJoinChallenge}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my" className="mt-6">
          {myChallenges.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-center">
                  You haven&apos;t joined any challenges yet.<br />
                  Browse available challenges to get started!
                </p>
                <Button className="mt-4" onClick={() => setTab('active')}>
                  Browse Challenges
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myChallenges.map((challenge) => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={challenge}
                  onJoin={handleJoinChallenge}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {completedChallenges.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-center">
                  No completed challenges yet.<br />
                  Keep working on your active challenges!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedChallenges.map((challenge) => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={challenge}
                  onJoin={handleJoinChallenge}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
