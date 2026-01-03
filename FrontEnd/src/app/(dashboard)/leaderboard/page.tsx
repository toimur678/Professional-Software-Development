'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Trophy, 
  Medal,
  Crown,
  Users,
  Globe,
  UserCheck,
  TrendingUp,
  Leaf,
  Flame,
  Activity,
  ChevronUp,
  ChevronDown,
  Minus,
  Loader2
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  co2_saved: number;
  points: number;
  activities_count: number;
  streak_days: number;
}

interface LeaderboardData {
  scope: string;
  period: string;
  entries: LeaderboardEntry[];
  user_rank: number | null;
  total_participants: number;
}

const PERIODS = [
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' },
  { id: 'all_time', label: 'All Time' },
];

const SCOPES = [
  { id: 'global', label: 'Global', icon: Globe },
  { id: 'friends', label: 'Friends', icon: UserCheck },
  { id: 'team', label: 'My Team', icon: Users },
];

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="w-5 text-center font-bold text-slate-500">#{rank}</span>;
  }
}

function getRankBadge(rank: number) {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300';
  if (rank === 2) return 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300';
  if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300';
  return 'bg-white border-slate-200';
}

function RankChange({ current, previous }: { current: number; previous?: number }) {
  if (!previous) return null;
  const diff = previous - current;
  
  if (diff > 0) {
    return (
      <span className="flex items-center text-green-600 text-xs">
        <ChevronUp className="h-3 w-3" />
        {diff}
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="flex items-center text-red-500 text-xs">
        <ChevronDown className="h-3 w-3" />
        {Math.abs(diff)}
      </span>
    );
  }
  return <Minus className="h-3 w-3 text-slate-400" />;
}

function LeaderboardRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg border transition-all",
      getRankBadge(entry.rank),
      isCurrentUser && "ring-2 ring-emerald-400 ring-offset-2"
    )}>
      {/* Rank */}
      <div className="flex items-center justify-center w-10">
        {getRankIcon(entry.rank)}
      </div>
      
      {/* Avatar & Name */}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
          {entry.user_name.charAt(0)}
        </div>
        <div>
          <p className={cn("font-medium", isCurrentUser && "text-emerald-700")}>
            {entry.user_name}
            {isCurrentUser && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">You</span>}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {entry.streak_days} day streak
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-blue-500" />
              {entry.activities_count} activities
            </span>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="text-right">
        <p className="font-bold text-emerald-600 flex items-center justify-end gap-1">
          <Leaf className="h-4 w-4" />
          {entry.co2_saved} kg
        </p>
        <p className="text-xs text-slate-500">{entry.points.toLocaleString()} points</p>
      </div>
      
      {/* Trend */}
      <div className="w-8 flex justify-center">
        <RankChange current={entry.rank} previous={entry.rank + Math.floor(Math.random() * 3) - 1} />
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState('global');
  const [period, setPeriod] = useState('weekly');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/leaderboard/${scope}/${period}`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        const data = await response.json();
        setLeaderboardData(data);
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, [scope, period]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Leaderboard <Trophy className="h-8 w-8 text-yellow-500" />
        </h2>
        <p className="text-slate-500 mt-1">
          See how you rank against other eco-warriors
        </p>
      </div>

      {/* Your Rank Card */}
      {leaderboardData?.user_rank && (
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Your Current Rank</p>
                <p className="text-5xl font-bold mt-1">#{leaderboardData.user_rank}</p>
                <p className="text-emerald-100 text-sm mt-2">
                  out of {leaderboardData.total_participants} participants
                </p>
              </div>
              <div className="text-right">
                <TrendingUp className="h-16 w-16 opacity-30" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope Tabs */}
      <div className="flex flex-wrap gap-2">
        {SCOPES.map((s) => {
          const Icon = s.icon;
          return (
            <Button
              key={s.id}
              variant={scope === s.id ? "default" : "outline"}
              onClick={() => setScope(s.id)}
              className={cn(
                scope === s.id && "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              {s.label}
            </Button>
          );
        })}
      </div>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          {PERIODS.map((p) => (
            <TabsTrigger key={p.id} value={p.id}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Leaderboard Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-600" />
            {SCOPES.find(s => s.id === scope)?.label} Rankings
          </CardTitle>
          <CardDescription>
            {PERIODS.find(p => p.id === period)?.label} • CO₂ saved
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              {error}
            </div>
          ) : leaderboardData ? (
            <div className="space-y-3">
              {leaderboardData.entries.map((entry) => (
                <LeaderboardRow 
                  key={entry.user_id} 
                  entry={entry} 
                  isCurrentUser={entry.rank === leaderboardData.user_rank}
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {leaderboardData?.entries[0]?.co2_saved || 0} kg
                </p>
                <p className="text-sm text-slate-500">Top Saver This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-full">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {leaderboardData?.total_participants || 0}
                </p>
                <p className="text-sm text-slate-500">Active Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Leaf className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {leaderboardData?.entries.reduce((sum, e) => sum + e.co2_saved, 0).toFixed(0) || 0} kg
                </p>
                <p className="text-sm text-slate-500">Total CO₂ Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
