'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts"
import { TrendingDown, Calendar, Target } from "lucide-react"

const weeklyData = [
  { day: "Mon", emissions: 8.5 },
  { day: "Tue", emissions: 7.2 },
  { day: "Wed", emissions: 5.8 },
  { day: "Thu", emissions: 6.4 },
  { day: "Fri", emissions: 7.1 },
  { day: "Sat", emissions: 4.2 },
  { day: "Sun", emissions: 3.8 },
]

const categoryData = [
  { name: "Transport", value: 45, color: "#3b82f6" },
  { name: "Diet", value: 30, color: "#10b981" },
  { name: "Energy", value: 25, color: "#f59e0b" },
]

const monthlyTrendData = [
  { month: "Jul", emissions: 180 },
  { month: "Aug", emissions: 165 },
  { month: "Sep", emissions: 150 },
  { month: "Oct", emissions: 142 },
  { month: "Nov", emissions: 135 },
  { month: "Dec", emissions: 127 },
]

export default function InsightsPage() {
  const totalWeeklyEmissions = weeklyData.reduce((acc, curr) => acc + curr.emissions, 0)
  const avgDailyEmissions = (totalWeeklyEmissions / 7).toFixed(1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Insights 📊
        </h2>
        <p className="text-slate-500 mt-1">
          Understand your carbon footprint patterns
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWeeklyEmissions.toFixed(1)} kg</div>
            <p className="text-xs text-emerald-600">↓ 12% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDailyEmissions} kg</div>
            <p className="text-xs text-slate-500">CO₂ per day</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
            <Target className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73%</div>
            <p className="text-xs text-slate-500">of monthly target</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Bar Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Daily Emissions</CardTitle>
            <CardDescription>Your daily CO₂ output this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}kg`} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value} kg CO₂`, "Emissions"]}
                />
                <Bar 
                  dataKey="emissions" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Emissions by Category</CardTitle>
            <CardDescription>Where your carbon comes from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, "Share"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Trend</CardTitle>
          <CardDescription>Your progress over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrendData}>
              <defs>
                <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}kg`} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`${value} kg CO₂`, "Total Emissions"]}
              />
              <Area 
                type="monotone" 
                dataKey="emissions" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEmissions)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
