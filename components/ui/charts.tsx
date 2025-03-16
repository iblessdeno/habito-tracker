"use client"

import React, { useState, useMemo } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Color palette for charts
const COLORS = [
  'hsl(var(--chart-1, 215 100% 50%))', // primary
  'hsl(var(--chart-2, 142 72% 29%))', // green
  'hsl(var(--chart-3, 47 100% 50%))', // amber
  'hsl(var(--chart-4, 0 100% 50%))', // red
  'hsl(var(--chart-5, 270 100% 64%))', // purple
  'hsl(var(--chart-6, 200 100% 60%))', // cyan
  'hsl(var(--chart-7, 30 100% 60%))', // orange
]

interface LineChartProps {
  data: any[]
  xKey: string
  yKey: string
  height?: number
  color?: string
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  name?: string
}

export function LineChart({
  data,
  xKey,
  yKey,
  height = 300,
  color = COLORS[0],
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  name = 'Value'
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xKey} 
          tick={{ fontSize: 12 }} 
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey={yKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

interface BarChartProps {
  data: any[]
  xKey: string
  yKey: string
  height?: number
  color?: string
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  name?: string
}

export function BarChart({
  data,
  xKey,
  yKey,
  height = 300,
  color = COLORS[0],
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  name = 'Value'
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xKey} 
          tick={{ fontSize: 12 }} 
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        <Bar 
          dataKey={yKey} 
          name={name} 
          fill={color} 
          radius={[4, 4, 0, 0]} 
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

interface PieChartProps {
  data: any[]
  nameKey: string
  valueKey: string
  title?: string
  description?: string
  height?: number
  colors?: string[]
  showTooltip?: boolean
  showLegend?: boolean
  interactive?: boolean
  valueLabel?: string
}

export function PieChart({
  data,
  nameKey,
  valueKey,
  title = "Distribution",
  description,
  height = 300,
  colors = COLORS,
  showTooltip = true,
  showLegend = false,
  interactive = true,
  valueLabel = "Count"
}: PieChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const items = useMemo(() => data.map(item => item[nameKey]), [data, nameKey]);
  const activeItem = data[activeIndex]?.[nameKey] || (data[0]?.[nameKey] || "");
  
  const handleSelect = (value: string) => {
    const index = data.findIndex(item => item[nameKey] === value);
    if (index !== -1) {
      setActiveIndex(index);
    }
  };
  
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        
        {interactive && items.length > 0 && (
          <Select value={activeItem} onValueChange={handleSelect}>
            <SelectTrigger
              className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
              aria-label="Select a category"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              {items.map((key, index) => (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                    {key}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-1 justify-center pb-0">
        <div className="mx-auto aspect-square w-full max-w-[300px]">
          <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              {showTooltip && <Tooltip />}
              {showLegend && (
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconSize={10}
                  iconType="circle"
                />
              )}
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60}
                outerRadius={80}
                strokeWidth={5}
                dataKey={valueKey}
                nameKey={nameKey}
                activeIndex={interactive ? activeIndex : undefined}
                activeShape={(props: PieSectorDataItem) => {
                  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                  return (
                    <g>
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius ? outerRadius + 10 : 0}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                      />
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={outerRadius ? outerRadius + 12 : 0}
                        outerRadius={outerRadius ? outerRadius + 25 : 0}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                      />
                    </g>
                  );
                }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
                
                {interactive && data.length > 0 && (
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {data[activeIndex]?.[valueKey]?.toLocaleString() || "0"}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              {valueLabel}
                            </tspan>
                          </text>
                        )
                      }
                      return null;
                    }}
                  />
                )}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface CalendarHeatmapProps {
  data: {
    date: string
    value: number
  }[]
  height?: number
  startDate?: Date
  endDate?: Date
}

export function CalendarHeatmap({
  data,
  height = 150,
  startDate = new Date(new Date().setDate(new Date().getDate() - 90)),
  endDate = new Date()
}: CalendarHeatmapProps) {
  // This is a placeholder for a calendar heatmap
  // In a real implementation, you would use a library like react-calendar-heatmap
  
  return (
    <div 
      style={{ height }} 
      className="flex items-center justify-center bg-muted/30 rounded-md"
    >
      <p className="text-muted-foreground text-sm">
        Calendar Heatmap (Placeholder)
      </p>
    </div>
  )
}
