import { Leaf, TrendingDown, Award, Car } from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { CarbonChart } from "@/components/dashboard/CarbonChart"
import { RecentActivity } from "@/components/dashboard/RecentActivity"

export default function DashboardPage() {
  // Mock data - replace with actual data from Supabase
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back! 👋
        </h2>
        <p className="text-slate-500 mt-1">{currentDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total CO₂ Saved"
          value="127.4 kg"
          icon={Leaf}
          description="This month"
          trend={{ value: 12.5, isPositive: true }}
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Weekly Average"
          value="4.2 kg/day"
          icon={TrendingDown}
          description="vs 5.8 kg last week"
          trend={{ value: 27.6, isPositive: true }}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Eco Score"
          value="847"
          icon={Award}
          description="+52 points this week"
          iconColor="text-orange-500"
        />
        <StatsCard
          title="Green Trips"
          value="23"
          icon={Car}
          description="Bike & Walk trips this month"
          iconColor="text-violet-600"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4">
          <CarbonChart />
        </div>
        <div className="col-span-3">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
