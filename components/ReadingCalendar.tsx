'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'

export function ReadingCalendar() {
  const [logs, setLogs] = useState<Record<string, { isCompleted: boolean; minutes: number }>>({})
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  // Generate date range (last 365 days)
  const dateRange = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // We want 365 days ago (or a full year)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 364)

    return { startDate, endDate: today }
  }, [])

  useEffect(() => {
    let mounted = true
    const fetchLogs = async () => {
      setIsLoading(true)
      
      const toLocalISOString = (d: Date) => {
        const tzOffset = d.getTimezoneOffset() * 60000;
        return (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
      }

      const startDateStr = toLocalISOString(dateRange.startDate)
      const endDateStr = toLocalISOString(dateRange.endDate)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('daily_reading_logs')
        .select('log_date, is_completed, total_minutes')
        .eq('user_id', user.id)
        .gte('log_date', startDateStr)
        .lte('log_date', endDateStr)

      if (error) {
        console.error('Error fetching logs:', error)
      } else if (mounted && data) {
        const logsMap: Record<string, { isCompleted: boolean; minutes: number }> = {}
        data.forEach(log => {
          logsMap[log.log_date] = { 
            isCompleted: log.is_completed, 
            minutes: log.total_minutes || 0 
          }
        })
        setLogs(logsMap)
      }
      if (mounted) setIsLoading(false)
    }
    
    fetchLogs()
    
    return () => {
      mounted = false
    }
  }, [dateRange, supabase])

  // Build the grid data structure
  const weeks = useMemo(() => {
    const days: (Date | null)[] = []
    
    // Pad start of first week (Sunday = 0)
    const startDayOfWeek = dateRange.startDate.getDay()
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all 365 days
    const current = new Date(dateRange.startDate)
    while (current <= dateRange.endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    // Pad end of last week
    while (days.length % 7 !== 0) {
      days.push(null)
    }

    // Chunk into weeks (arrays of 7)
    const weeksArr: (Date | null)[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeksArr.push(days.slice(i, i + 7))
    }
    return weeksArr
  }, [dateRange])

  const monthLabels = useMemo(() => {
    const labels: { name: string, colIndex: number }[] = []
    let currentMonth = -1
    
    weeks.forEach((week, index) => {
      // Find the first valid day in the week to determine its month
      const firstValidDay = week.find(day => day !== null)
      if (firstValidDay) {
        const month = firstValidDay.getMonth()
        if (month !== currentMonth) {
          // If the month starts, add a label for this column
          labels.push({ 
            name: firstValidDay.toLocaleString('default', { month: 'short' }), 
            colIndex: index 
          })
          currentMonth = month
        }
      }
    })
    return labels
  }, [weeks])

  const toLocalISOString = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
  }

  // Count total reading days
  const totalCompleted = Object.keys(logs).length

  return (
    <div className="flex flex-col bg-[#0d1117] border border-[#30363d] rounded-lg p-5 w-full text-[#c9d1d9] font-sans text-xs overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">
          {totalCompleted} active reading days in the last year
        </h2>
      </div>

      <div className={`relative flex transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {/* Day labels (Mon, Wed, Fri) */}
        <div className="flex flex-col gap-[3px] pt-[22px] pr-2 w-8 flex-shrink-0 text-[#8b949e]">
          <div className="h-[10px]" /> {/* Sun */}
          <div className="h-[10px] leading-[10px]">Mon</div> {/* Mon */}
          <div className="h-[10px]" /> {/* Tue */}
          <div className="h-[10px] leading-[10px]">Wed</div> {/* Wed */}
          <div className="h-[10px]" /> {/* Thu */}
          <div className="h-[10px] leading-[10px]">Fri</div> {/* Fri */}
          <div className="h-[10px]" /> {/* Sat */}
        </div>

        {/* Grid and Month labels container */}
        <div className="flex flex-col w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent">
          {/* Month labels */}
          <div className="flex relative h-5 text-[#8b949e] mb-1">
            {monthLabels.map(label => (
              <div 
                key={label.colIndex + label.name}
                className="absolute"
                style={{ left: `${label.colIndex * 13}px` }}
              >
                {label.name}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="w-[10px] h-[10px] rounded-[2px] bg-transparent" />
                  }
                  
                  const dateStr = toLocalISOString(day)
                  const log = logs[dateStr]
                  const minutes = log?.minutes || 0
                  
                  let bgColor = 'bg-[#161b22]'
                  if (minutes >= 60) {
                    bgColor = 'bg-[#39d353]' // Bold
                  } else if (minutes >= 30) {
                    bgColor = 'bg-[#26a641]' // Medium
                  } else if (minutes >= 20) {
                    bgColor = 'bg-[#006d32]' // Medium-Low
                  } else if (minutes > 0) {
                    bgColor = 'bg-[#0e4429]' // Low
                  }
                  
                  return (
                    <div 
                      key={dayIndex}
                      title={`${minutes} mins read on ${day.toDateString()}`}
                      className={`w-[10px] h-[10px] rounded-[2px] ${bgColor} transition-colors hover:ring-1 hover:ring-white/50 cursor-default outline outline-1 outline-offset-[-1px] outline-white/5`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-[#8b949e]">
        <div className="hover:text-[#58a6ff] cursor-pointer transition-colors">
          Learn how we track reading goals
        </div>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#161b22] outline outline-1 outline-offset-[-1px] outline-white/5" title="0 mins" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#0e4429]" title="1-19 mins" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#006d32]" title="20-29 mins" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641]" title="30-59 mins" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#39d353]" title="60+ mins" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
