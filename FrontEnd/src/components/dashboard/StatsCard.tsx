import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  description: string
  trend?: {
    value: number
    isPositive: boolean
  }
  iconColor?: string
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  iconColor = "text-emerald-600"
}: StatsCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      <Icon className={cn("h-5 w-5", iconColor)} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trend.isPositive ? "text-emerald-600" : "text-red-500"
          )}>
            {trend.isPositive ? "↓" : "↑"} {Math.abs(trend.value)}%
          </span>
        )}
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </CardContent>
  </Card>
)
