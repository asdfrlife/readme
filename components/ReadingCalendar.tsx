'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ReadingCalendar() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  
  const [logs, setLogs] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const fetchLogs = async () => {
      setIsLoading(true)
      
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      // Format dates for Supabase query (YYYY-MM-DD)
      // Dates should be in local time to match what user sees
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      // We need local ISO-like strings (YYYY-MM-DD)
      const toLocalISOString = (d: Date) => {
        const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
        return (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
      }

      const startDateStr = toLocalISOString(startDate)
      const endDateStr = toLocalISOString(endDate)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('daily_reading_logs')
        .select('log_date, is_completed')
        .eq('user_id', user.id)
        .gte('log_date', startDateStr)
        .lte('log_date', endDateStr)

      if (error) {
        console.error('Error fetching logs:', error)
      } else if (mounted && data) {
        const logsMap: Record<string, boolean> = {}
        data.forEach(log => {
          logsMap[log.log_date] = log.is_completed
        })
        setLogs(logsMap)
      }
      if (mounted) setIsLoading(false)
    }
    
    fetchLogs()
    
    return () => {
      mounted = false
    }
  }, [currentDate, supabase])

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sunday
  
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = today.getDate()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Generate grid cells
  const cells = []
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="w-8 h-8 md:w-10 md:h-10" />)
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isCompleted = logs[dateStr] === true
    const isToday = isCurrentMonth && day === todayDate
    
    let cellClasses = "w-8 h-8 md:w-10 md:h-10 rounded-md transition-colors flex items-center justify-center text-xs "
    
    if (isCompleted) {
      cellClasses += "bg-purple-500 text-white font-medium shadow-[0_0_10px_rgba(168,85,247,0.4)]"
    } else {
      cellClasses += "bg-white/5 border border-white/10 text-white/40"
    }

    if (isToday) {
      cellClasses += " ring-2 ring-white/60 ring-offset-2 ring-offset-[#121212]"
    }

    cells.push(
      <div 
        key={day} 
        className={cellClasses}
        title={`${monthNames[month]} ${day}, ${year}`}
      >
        {day}
      </div>
    )
  }

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="flex flex-col items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 w-full max-w-md">
      <div className="flex items-center justify-between w-full mb-6">
        <button 
          onClick={handlePrevMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white tracking-wide">
          {monthNames[month]} {year}
        </h2>
        <button 
          onClick={handleNextMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          aria-label="Next Month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 w-full justify-items-center mb-2">
        {dayLabels.map(label => (
          <div key={label} className="text-white/40 text-xs font-semibold w-8 md:w-10 text-center">
            {label}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-2 w-full justify-items-center transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {cells}
      </div>
      
      <div className="flex items-center gap-4 mt-6 text-xs text-white/50 w-full justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" />
          <span>No reading</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.4)]" />
          <span>10+ mins</span>
        </div>
      </div>
    </div>
  )
}
