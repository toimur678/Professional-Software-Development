'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Users, 
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Crown,
  Shield,
  Leaf,
  Trophy,
  TrendingUp,
  Plus,
  Mail,
  Check,
  X,
  Loader2,
  AlertCircle,
  Copy,
  Share2,
  Settings,
  ChevronRight
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  total_co2_saved: number;
  weekly_co2_saved: number;
  is_public: boolean;
  user_role: string | null;
}

interface Friend {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  level: number;
  co2_saved_weekly: number;
}

interface FriendRequest {
  id: string;
  from_user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  created_at: string;
}

function TeamCard({ team, onJoin }: { team: Team; onJoin: (id: string) => void }) {
  const isMember = team.user_role !== null;
  
  return (
    <Card className={cn(
      "hover:shadow-lg transition-all",
      isMember && "border-emerald-200 bg-emerald-50/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
            {team.name.charAt(0)}
          </div>
          <div className="flex items-center gap-2">
            {team.user_role === 'owner' && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Crown className="h-3 w-3" /> Owner
              </span>
            )}
            {team.user_role === 'admin' && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Shield className="h-3 w-3" /> Admin
              </span>
            )}
            {team.user_role === 'member' && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                Member
              </span>
            )}
          </div>
        </div>
        
        <CardTitle className="text-lg mt-3">{team.name}</CardTitle>
        <CardDescription>{team.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-600">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-slate-900">{team.member_count}</p>
            <p className="text-xs text-slate-500">Members</p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-emerald-600">
              <Leaf className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-emerald-600">{team.total_co2_saved}</p>
            <p className="text-xs text-slate-500">kg saved</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-blue-600">{team.weekly_co2_saved}</p>
            <p className="text-xs text-slate-500">this week</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        {isMember ? (
          <Button variant="outline" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            View Team
          </Button>
        ) : (
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => onJoin(team.id)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Join Team
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-slate-50 transition-colors">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
        {friend.full_name.charAt(0)}
      </div>
      
      <div className="flex-1">
        <p className="font-medium text-slate-900">{friend.full_name}</p>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Trophy className="h-3 w-3 text-amber-500" />
            Level {friend.level}
          </span>
          <span className="flex items-center gap-1">
            <Leaf className="h-3 w-3 text-emerald-500" />
            {friend.co2_saved_weekly} kg/week
          </span>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-emerald-600">{friend.total_points}</p>
        <p className="text-xs text-slate-500">points</p>
      </div>
      
      <Button variant="ghost" size="sm">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function FriendRequestCard({ 
  request, 
  onAccept, 
  onReject 
}: { 
  request: FriendRequest; 
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-blue-50 border-blue-200">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
        {request.from_user.name.charAt(0)}
      </div>
      
      <div className="flex-1">
        <p className="font-medium text-slate-900">{request.from_user.name}</p>
        <p className="text-sm text-slate-500">wants to be your friend</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => onAccept(request.id)}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onReject(request.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [tab, setTab] = useState('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        if (tab === 'teams') {
          const response = await fetch('http://127.0.0.1:8000/api/teams');
          if (!response.ok) throw new Error('Failed to fetch teams');
          const data = await response.json();
          setTeams(data.teams);
        } else {
          const response = await fetch('http://127.0.0.1:8000/api/friends');
          if (!response.ok) throw new Error('Failed to fetch friends');
          const data = await response.json();
          setFriends(data.friends);
          setPendingRequests(data.pending_requests);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [tab]);

  const handleJoinTeam = async (teamId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/teams/${teamId}/join`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to join team');
      
      setTeams(prev => prev.map(t => 
        t.id === teamId 
          ? { ...t, user_role: 'member', member_count: t.member_count + 1 }
          : t
      ));
    } catch (err) {
      console.error('Join team error:', err);
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setPendingRequests(prev => Math.max(0, prev - 1));
    // In production, call API to accept request
  };

  const handleRejectRequest = (requestId: string) => {
    setPendingRequests(prev => Math.max(0, prev - 1));
    // In production, call API to reject request
  };

  const handleSendInvite = () => {
    if (inviteEmail) {
      // In production, call API to send invite
      setInviteEmail('');
      alert('Invite sent!');
    }
  };

  // Sample pending requests
  const sampleRequests: FriendRequest[] = [
    {
      id: 'req-1',
      from_user: { id: 'user-1', name: 'Alex Rivers', avatar_url: null },
      created_at: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Community <Users className="h-8 w-8 text-blue-500" />
        </h2>
        <p className="text-slate-500 mt-1">
          Connect with teams and friends for greater impact
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-3xl font-bold">{friends.length}</p>
                <p className="text-sm opacity-80">Friends</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teams.filter(t => t.user_role !== null).length}
                </p>
                <p className="text-sm text-slate-500">My Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests}</p>
                <p className="text-sm text-slate-500">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Leaf className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {friends.reduce((sum, f) => sum + f.co2_saved_weekly, 0).toFixed(0)}
                </p>
                <p className="text-sm text-slate-500">Friends&apos; kg/week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Friends
              {pendingRequests > 0 && (
                <span className="ml-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRequests}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={`Search ${tab}...`}
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {tab === 'teams' && (
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>
        </div>
        
        <TabsContent value="teams" className="mt-6">
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
              {teams.map((team) => (
                <TeamCard 
                  key={team.id} 
                  team={team}
                  onJoin={handleJoinTeam}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="friends" className="mt-6 space-y-6">
          {/* Pending Requests */}
          {pendingRequests > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                Pending Requests ({pendingRequests})
              </h3>
              {sampleRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
              ))}
            </div>
          )}
          
          {/* Invite Friends */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Share2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">Invite Friends</h3>
                  <p className="text-sm text-slate-500">
                    Share EcoWisely and earn bonus points!
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter email"
                    className="w-48"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button onClick={handleSendInvite}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Friends List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500 gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : friends.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserPlus className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-center">
                  No friends yet.<br />
                  Invite your friends to join EcoWisely!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">
                My Friends ({friends.length})
              </h3>
              {friends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
