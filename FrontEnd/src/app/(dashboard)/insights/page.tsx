import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InsightsClient from "./InsightsClient"

// Type definitions
type SummaryRow = { date: string; total_co2: number }
type ActivityRow = { category: string; co2_kg: number }

export default async function InsightsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get daily summaries for the last 7 days
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: dailySummariesData } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })
  const dailySummaries = (dailySummariesData as SummaryRow[] | null) || []

  // Get all activities for category breakdown
  const { data: activitiesData } = await supabase
    .from('activities')
    .select('category, co2_kg')
    .eq('user_id', user.id)
  const activities = (activitiesData as ActivityRow[] | null) || []

  // Get monthly summaries for trend
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: monthlySummariesData } = await supabase
    .from('daily_summaries')
    .select('date, total_co2')
    .eq('user_id', user.id)
    .gte('date', sixMonthsAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })
  const monthlySummaries = (monthlySummariesData as SummaryRow[] | null) || []

  // Process weekly data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeklyData = dailySummaries.map(summary => ({
    day: dayNames[new Date(summary.date).getDay()],
    emissions: summary.total_co2 || 0
  }))

  // If no data, provide default empty week
  if (weeklyData.length === 0) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      weeklyData.push({ day: dayNames[d.getDay()], emissions: 0 })
    }
  }

  // Calculate category totals
  const categoryTotals = { transport: 0, diet: 0, energy: 0 }
  activities.forEach(activity => {
    if (activity.category in categoryTotals) {
      categoryTotals[activity.category as keyof typeof categoryTotals] += activity.co2_kg || 0
    }
  })
  
  const totalCategoryEmissions = categoryTotals.transport + categoryTotals.diet + categoryTotals.energy
  const categoryData = totalCategoryEmissions > 0 ? [
    { name: "Transport", value: Math.round((categoryTotals.transport / totalCategoryEmissions) * 100), color: "#3b82f6" },
    { name: "Diet", value: Math.round((categoryTotals.diet / totalCategoryEmissions) * 100), color: "#10b981" },
    { name: "Energy", value: Math.round((categoryTotals.energy / totalCategoryEmissions) * 100), color: "#f59e0b" },
  ] : [
    { name: "Transport", value: 33, color: "#3b82f6" },
    { name: "Diet", value: 34, color: "#10b981" },
    { name: "Energy", value: 33, color: "#f59e0b" },
  ]

  // Process monthly trend data
  const monthlyTotals: { [key: string]: number } = {}
  monthlySummaries.forEach(summary => {
    const monthKey = new Date(summary.date).toLocaleString('default', { month: 'short' })
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (summary.total_co2 || 0)
  })

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = today.getMonth()
  const monthlyTrendData = []
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12
    const monthName = monthNames[monthIndex]
    monthlyTrendData.push({
      month: monthName,
      emissions: Math.round(monthlyTotals[monthName] || 0)
    })
  }

  // Calculate totals
  const totalWeeklyEmissions = weeklyData.reduce((acc, curr) => acc + curr.emissions, 0)
  const avgDailyEmissions = weeklyData.length > 0 ? totalWeeklyEmissions / weeklyData.length : 0

  return (
    <InsightsClient
      weeklyData={weeklyData}
      categoryData={categoryData}
      monthlyTrendData={monthlyTrendData}
      totalWeeklyEmissions={totalWeeklyEmissions}
      avgDailyEmissions={avgDailyEmissions}
    />
  )
}
