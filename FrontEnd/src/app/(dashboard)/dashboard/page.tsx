import { Leaf, TrendingDown, Award, Car } from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { CarbonChart } from "@/components/dashboard/CarbonChart"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Type definitions for Supabase responses
type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

type PointsRow = {
  user_id: string
  total_points: number
  level: number
  trees_planted: number
}

type ActivityRow = {
  id: string
  user_id: string
  date: string
  category: string
  type: string
  value: number
  co2_kg: number
  created_at: string
}

type SummaryRow = {
  id: string
  user_id: string
  date: string
  transport_co2: number
  diet_co2: number
  energy_co2: number
  total_co2: number
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  const profile = profileData as ProfileRow | null

  // Get user points
  const { data: pointsData } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', user.id)
    .single()
  const points = pointsData as PointsRow | null

  // Get recent activities
  const { data: activitiesData } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  const activities = (activitiesData as ActivityRow[] | null) || []

  // Get weekly summaries (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: summariesData } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })
  const summaries = (summariesData as SummaryRow[] | null) || []

  // Calculate total CO2 this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  
  const { data: monthlyDataRaw } = await supabase
    .from('daily_summaries')
    .select('total_co2')
    .eq('user_id', user.id)
    .gte('date', startOfMonth.toISOString().split('T')[0])
  const monthlyData = (monthlyDataRaw as { total_co2: number }[] | null) || []

  const totalCO2ThisMonth = monthlyData.reduce((acc, curr) => acc + (curr.total_co2 || 0), 0)

  // Count green trips (bike, walk, bus, train)
  const { count: greenTrips } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('category', 'transport')
    .in('type', ['bike', 'walk', 'bus', 'train'])
    .gte('date', startOfMonth.toISOString().split('T')[0])
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const userName = profile?.full_name?.split(' ')[0] || 'there'

  // Transform summaries to chart data
  const chartData = summaries.map(s => ({
    date: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
    transport: Number(s.transport_co2) || 0,
    diet: Number(s.diet_co2) || 0,
    energy: Number(s.energy_co2) || 0,
  }))

  // Transform activities for recent activity component
  const recentActivities = activities.map(a => ({
    id: a.id,
    type: a.category as 'transport' | 'diet' | 'energy',
    description: `${a.type} - ${a.value} ${a.category === 'transport' ? 'km' : a.category === 'energy' ? 'kWh' : 'servings'}`,
    impact: -Number(a.co2_kg),
    timestamp: new Date(a.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {userName}! 👋
        </h2>
        <p className="text-slate-500 mt-1">{currentDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total CO₂ Tracked"
          value={`${totalCO2ThisMonth.toFixed(1)} kg`}
          icon={Leaf}
          description="This month"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Weekly Average"
          value={`${(chartData.reduce((acc, c) => acc + c.transport + c.diet + c.energy, 0) / Math.max(chartData.length, 1)).toFixed(1)} kg/day`}
          icon={TrendingDown}
          description="Based on recent data"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Eco Score"
          value={`${points?.total_points || 0}`}
          icon={Award}
          description={`Level ${points?.level || 1}`}
          iconColor="text-orange-500"
        />
        <StatsCard
          title="Green Trips"
          value={`${greenTrips || 0}`}
          icon={Car}
          description="Bike, Walk, Bus & Train this month"
          iconColor="text-violet-600"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4">
          <CarbonChart data={chartData.length > 0 ? chartData : undefined} />
        </div>
        <div className="col-span-3">
          <RecentActivity activities={recentActivities.length > 0 ? recentActivities : undefined} />
        </div>
      </div>
    </div>
  )
}
