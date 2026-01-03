'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"

interface CarbonChartProps {
  data?: Array<{
    date: string
    transport: number
    diet: number
    energy: number
  }>
}

const defaultData = [
  { date: "Mon", transport: 4.5, diet: 2.3, energy: 3.1 },
  { date: "Tue", transport: 3.8, diet: 2.5, energy: 2.8 },
  { date: "Wed", transport: 2.1, diet: 2.1, energy: 3.2 },
  { date: "Thu", transport: 4.2, diet: 1.9, energy: 2.5 },
  { date: "Fri", transport: 3.5, diet: 2.4, energy: 2.9 },
  { date: "Sat", transport: 1.8, diet: 2.8, energy: 3.4 },
  { date: "Sun", transport: 1.2, diet: 2.6, energy: 3.0 },
]

export function CarbonChart({ data = defaultData }: CarbonChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          Weekly Carbon Footprint
        </CardTitle>
        <p className="text-sm text-slate-500">
          Your emissions breakdown by category (kg CO₂)
        </p>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} kg`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12px"
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="transport" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2 }}
              name="Transport"
            />
            <Line 
              type="monotone" 
              dataKey="diet" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: "#10b981", strokeWidth: 2 }}
              name="Diet"
            />
            <Line 
              type="monotone" 
              dataKey="energy" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: "#f59e0b", strokeWidth: 2 }}
              name="Energy"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
