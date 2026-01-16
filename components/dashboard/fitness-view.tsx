"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Dumbbell,
  Flame,
  Clock,
  TrendingUp,
  Moon,
  Heart,
  Activity,
  Droplets,
  Footprints,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import type { WorkoutLog, Exercise } from "@/lib/types"

interface FitnessViewProps {
  categoryId: string
  workoutLogs: WorkoutLog[]
  onAddWorkout: (workout: Omit<WorkoutLog, "id" | "created_at" | "updated_at">) => Promise<void>
  onUpdateWorkout: (id: string, workout: Partial<WorkoutLog>) => Promise<void>
  onDeleteWorkout: (id: string) => Promise<void>
}

const WORKOUT_TYPES = ["Strength", "Cardio", "HIIT", "Yoga", "Sports", "Swimming", "Cycling", "Running", "Other"]

export function FitnessView({
  categoryId,
  workoutLogs,
  onAddWorkout,
  onUpdateWorkout,
  onDeleteWorkout,
}: FitnessViewProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutLog | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Extended form state with new health metrics
  const [formData, setFormData] = useState<{
    workout_date: string
    workout_type: string
    exercises: Exercise[]
    duration_minutes: number
    calories_burned: number
    notes: string
    rpe: number
    sleep_quality: number
    // New health metrics
    weight_kg: number | undefined
    body_fat_percentage: number | undefined
    resting_heart_rate: number | undefined
    steps: number | undefined
    water_intake_ml: number | undefined
    protein_intake_g: number | undefined
    mood: string
    energy_level: number
    soreness_level: number
  }>({
    workout_date: new Date().toISOString().split("T")[0],
    workout_type: "Strength",
    exercises: [{ name: "", sets: 3, reps: 10, weight: 0 }],
    duration_minutes: 60,
    calories_burned: 300,
    notes: "",
    rpe: 7,
    sleep_quality: 3,
    weight_kg: undefined,
    body_fat_percentage: undefined,
    resting_heart_rate: undefined,
    steps: undefined,
    water_intake_ml: undefined,
    protein_intake_g: undefined,
    mood: "good",
    energy_level: 7,
    soreness_level: 3,
  })

  // Extended stats calculations
  const stats = useMemo(() => {
    if (workoutLogs.length === 0) return null

    const last7Days = workoutLogs.filter((w) => {
      const diff = Date.now() - new Date(w.workout_date).getTime()
      return diff <= 7 * 24 * 60 * 60 * 1000
    })

    const last30Days = workoutLogs.filter((w) => {
      const diff = Date.now() - new Date(w.workout_date).getTime()
      return diff <= 30 * 24 * 60 * 60 * 1000
    })

    const totalCalories = last30Days.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
    const totalDuration = last30Days.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
    const avgRpe = last30Days.length > 0 ? last30Days.reduce((sum, w) => sum + (w.rpe || 0), 0) / last30Days.length : 0
    const avgSleep =
      last30Days.length > 0 ? last30Days.reduce((sum, w) => sum + (w.sleep_quality || 0), 0) / last30Days.length : 0

    // Calculate streaks
    const sortedDates = [...new Set(workoutLogs.map((w) => w.workout_date))].sort().reverse()
    let currentStreak = 0
    let checkDate = new Date()
    for (const dateStr of sortedDates) {
      const workoutDate = new Date(dateStr)
      const diffDays = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (24 * 60 * 60 * 1000))
      if (diffDays <= 1) {
        currentStreak++
        checkDate = workoutDate
      } else {
        break
      }
    }

    // Workout type breakdown
    const typeBreakdown = last30Days.reduce(
      (acc, w) => {
        acc[w.workout_type] = (acc[w.workout_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate total volume (sets * reps * weight)
    const totalVolume = last30Days.reduce((sum, w) => {
      const workoutVolume = w.exercises.reduce((exSum, ex) => exSum + ex.sets * ex.reps * (ex.weight || 0), 0)
      return sum + workoutVolume
    }, 0)

    return {
      workoutsThisWeek: last7Days.length,
      workoutsThisMonth: last30Days.length,
      totalCalories,
      totalDuration,
      avgRpe: avgRpe.toFixed(1),
      avgSleep: avgSleep.toFixed(1),
      currentStreak,
      typeBreakdown,
      totalVolume: Math.round(totalVolume),
      avgDuration: last30Days.length > 0 ? Math.round(totalDuration / last30Days.length) : 0,
    }
  }, [workoutLogs])

  // Chart data - 14 days
  const chartData = useMemo(() => {
    const last14Days = [...Array(14)].map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (13 - i))
      const dateStr = date.toISOString().split("T")[0]
      const dayWorkouts = workoutLogs.filter((w) => w.workout_date === dateStr)
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        workouts: dayWorkouts.length,
        calories: dayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
        duration: dayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
        rpe: dayWorkouts.length > 0 ? dayWorkouts.reduce((sum, w) => sum + (w.rpe || 0), 0) / dayWorkouts.length : 0,
        sleep:
          dayWorkouts.length > 0
            ? dayWorkouts.reduce((sum, w) => sum + (w.sleep_quality || 0), 0) / dayWorkouts.length
            : 0,
      }
    })
    return last14Days
  }, [workoutLogs])

  // Weekly comparison data
  const weeklyData = useMemo(() => {
    const weeks = [...Array(8)].map((_, weekIndex) => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (7 - weekIndex) * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weekWorkouts = workoutLogs.filter((w) => {
        const workoutDate = new Date(w.workout_date)
        return workoutDate >= weekStart && workoutDate < weekEnd
      })

      return {
        week: `W${weekIndex + 1}`,
        workouts: weekWorkouts.length,
        totalCalories: weekWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
        totalDuration: weekWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
      }
    })
    return weeks
  }, [workoutLogs])

  // Radar chart data for workout balance
  const radarData = useMemo(() => {
    const last30Days = workoutLogs.filter((w) => {
      const diff = Date.now() - new Date(w.workout_date).getTime()
      return diff <= 30 * 24 * 60 * 60 * 1000
    })

    const typeCount = {
      Strength: 0,
      Cardio: 0,
      HIIT: 0,
      Yoga: 0,
      Sports: 0,
      Other: 0,
    }

    last30Days.forEach((w) => {
      const type = w.workout_type as keyof typeof typeCount
      if (type in typeCount) {
        typeCount[type]++
      } else {
        typeCount.Other++
      }
    })

    const maxCount = Math.max(...Object.values(typeCount), 1)

    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      value: Math.round((count / maxCount) * 100),
      count,
    }))
  }, [workoutLogs])

  const handleAddExercise = () => {
    setFormData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { name: "", sets: 3, reps: 10, weight: 0 }],
    }))
  }

  const handleRemoveExercise = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }))
  }

  const handleExerciseChange = (index: number, field: keyof Exercise, value: any) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    }))
  }

  const handleAddWorkout = async () => {
    setIsLoading(true)
    try {
      await onAddWorkout({
        category_id: categoryId,
        ...formData,
        exercises: formData.exercises.filter((e) => e.name.trim()),
      })
      setAddDialogOpen(false)
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateWorkout = async () => {
    if (!selectedWorkout) return
    setIsLoading(true)
    try {
      await onUpdateWorkout(selectedWorkout.id, {
        ...formData,
        exercises: formData.exercises.filter((e) => e.name.trim()),
      })
      setEditDialogOpen(false)
      setSelectedWorkout(null)
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWorkout = async () => {
    if (!selectedWorkout) return
    setIsLoading(true)
    try {
      await onDeleteWorkout(selectedWorkout.id)
      setDeleteDialogOpen(false)
      setSelectedWorkout(null)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (workout: WorkoutLog) => {
    setSelectedWorkout(workout)
    setFormData({
      workout_date: workout.workout_date,
      workout_type: workout.workout_type,
      exercises: workout.exercises.length > 0 ? workout.exercises : [{ name: "", sets: 3, reps: 10, weight: 0 }],
      duration_minutes: workout.duration_minutes || 60,
      calories_burned: workout.calories_burned || 300,
      notes: workout.notes || "",
      rpe: workout.rpe || 7,
      sleep_quality: workout.sleep_quality || 3,
      weight_kg: undefined,
      body_fat_percentage: undefined,
      resting_heart_rate: undefined,
      steps: undefined,
      water_intake_ml: undefined,
      protein_intake_g: undefined,
      mood: "good",
      energy_level: 7,
      soreness_level: 3,
    })
    setEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      workout_date: new Date().toISOString().split("T")[0],
      workout_type: "Strength",
      exercises: [{ name: "", sets: 3, reps: 10, weight: 0 }],
      duration_minutes: 60,
      calories_burned: 300,
      notes: "",
      rpe: 7,
      sleep_quality: 3,
      weight_kg: undefined,
      body_fat_percentage: undefined,
      resting_heart_rate: undefined,
      steps: undefined,
      water_intake_ml: undefined,
      protein_intake_g: undefined,
      mood: "good",
      energy_level: 7,
      soreness_level: 3,
    })
  }

  const chartColors = {
    calories: "#f97316",
    duration: "#3b82f6",
    workouts: "#22c55e",
    rpe: "#8b5cf6",
    sleep: "#06b6d4",
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Gym & Fitness</h1>
          <p className="text-sm text-muted-foreground">Track your workouts, health metrics, and progress</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Workout
        </Button>
      </div>

      {/* Stats Cards - Expanded */}
      {stats && (
        <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workoutsThisWeek}</div>
              <p className="text-xs text-muted-foreground">workouts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Current Streak</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <p className="text-xs text-muted-foreground">days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Calories Burned</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.totalDuration / 60)}h</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Avg Effort</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRpe}/10</div>
              <p className="text-xs text-muted-foreground">RPE</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Volume</CardTitle>
              <Dumbbell className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.totalVolume / 1000).toFixed(1)}k</div>
              <p className="text-xs text-muted-foreground">kg lifted</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Calories and duration over the last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="calories" name="Calories" fill={chartColors.calories} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="duration" name="Minutes" fill={chartColors.duration} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recovery Metrics</CardTitle>
                <CardDescription>Sleep quality and RPE trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} domain={[0, 10]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="rpe"
                        name="RPE"
                        stroke={chartColors.rpe}
                        fill={chartColors.rpe}
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="sleep"
                        name="Sleep (x2)"
                        stroke={chartColors.sleep}
                        fill={chartColors.sleep}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workout Balance Radar */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workout Balance</CardTitle>
                <CardDescription>Distribution of workout types this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid className="stroke-border" />
                      <PolarAngleAxis dataKey="type" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Radar
                        name="Workouts"
                        dataKey="value"
                        stroke={chartColors.workouts}
                        fill={chartColors.workouts}
                        fillOpacity={0.5}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>Workout count over the last 8 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="week" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="workouts"
                        name="Workouts"
                        stroke={chartColors.workouts}
                        strokeWidth={2}
                        dot={{ fill: chartColors.workouts }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Health Metrics Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-red-500/10 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Heart Rate</CardTitle>
                <Heart className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72</div>
                <p className="text-xs text-muted-foreground">BPM (resting)</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Steps</CardTitle>
                <Footprints className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,432</div>
                <p className="text-xs text-muted-foreground">daily average</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Hydration</CardTitle>
                <Droplets className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4L</div>
                <p className="text-xs text-muted-foreground">daily avg</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sleep Avg</CardTitle>
                <Moon className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.avgSleep || 0}/5</div>
                <p className="text-xs text-muted-foreground">quality score</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Volume Progression</CardTitle>
                <CardDescription>Total weight lifted per week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="week" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalCalories"
                        name="Calories"
                        stroke={chartColors.calories}
                        fill={chartColors.calories}
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Time</CardTitle>
                <CardDescription>Weekly duration breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="week" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="totalDuration" name="Minutes" fill={chartColors.duration} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Goals</CardTitle>
              <CardDescription>Track your fitness targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Workouts</span>
                    <span className="text-sm text-muted-foreground">{stats?.workoutsThisMonth || 0}/20</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(((stats?.workoutsThisMonth || 0) / 20) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Calories</span>
                    <span className="text-sm text-muted-foreground">
                      {stats?.totalCalories.toLocaleString() || 0}/10,000
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all"
                      style={{ width: `${Math.min(((stats?.totalCalories || 0) / 10000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Hours</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((stats?.totalDuration || 0) / 60)}/30
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(((stats?.totalDuration || 0) / 60 / 30) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Workout Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your complete workout history</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Dumbbell className="mb-4 h-16 w-16 text-muted-foreground/50" />
                  <p className="mb-2 text-lg font-medium">No workouts logged yet</p>
                  <p className="mb-4 text-sm text-muted-foreground">Start tracking your fitness journey</p>
                  <Button onClick={() => setAddDialogOpen(true)} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Log your first workout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {workoutLogs.map((workout) => (
                    <div
                      key={workout.id}
                      className="group flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Dumbbell className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{workout.workout_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(workout.workout_date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                            {workout.duration_minutes && ` • ${workout.duration_minutes} min`}
                            {workout.calories_burned && ` • ${workout.calories_burned} cal`}
                          </p>
                          {workout.exercises.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {workout.exercises
                                .slice(0, 3)
                                .map((e) => e.name)
                                .filter(Boolean)
                                .join(", ")}
                              {workout.exercises.length > 3 && ` +${workout.exercises.length - 3} more`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(workout)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedWorkout(workout)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Workout Dialog */}
      <Dialog
        open={addDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false)
            setEditDialogOpen(false)
            setSelectedWorkout(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? "Edit Workout" : "Log Workout"}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? "Update your workout details" : "Record your training session"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.workout_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, workout_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Workout Type</Label>
                <select
                  value={formData.workout_type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, workout_type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {WORKOUT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Calories Burned</Label>
                <Input
                  type="number"
                  value={formData.calories_burned}
                  onChange={(e) => setFormData((prev) => ({ ...prev, calories_burned: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Exercises</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddExercise}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Exercise
                </Button>
              </div>
              {formData.exercises.map((exercise, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 rounded-xl border border-border p-3">
                  <div className="col-span-12 sm:col-span-4">
                    <Input
                      placeholder="Exercise name"
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      placeholder="Sets"
                      value={exercise.sets}
                      onChange={(e) => handleExerciseChange(index, "sets", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={exercise.reps}
                      onChange={(e) => handleExerciseChange(index, "reps", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-3">
                    <Input
                      type="number"
                      placeholder="Weight (kg)"
                      value={exercise.weight || ""}
                      onChange={(e) =>
                        handleExerciseChange(index, "weight", e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveExercise(index)}
                      disabled={formData.exercises.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <Label>RPE (Rate of Perceived Exertion): {formData.rpe}/10</Label>
              <Slider
                value={[formData.rpe]}
                onValueChange={([v]) => setFormData((prev) => ({ ...prev, rpe: v }))}
                max={10}
                min={1}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Sleep Quality: {formData.sleep_quality}/5
              </Label>
              <Slider
                value={[formData.sleep_quality]}
                onValueChange={([v]) => setFormData((prev) => ({ ...prev, sleep_quality: v }))}
                max={5}
                min={1}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Energy Level: {formData.energy_level}/10
              </Label>
              <Slider
                value={[formData.energy_level]}
                onValueChange={([v]) => setFormData((prev) => ({ ...prev, energy_level: v }))}
                max={10}
                min={1}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="How did you feel? Any observations?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false)
                setEditDialogOpen(false)
                setSelectedWorkout(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={editDialogOpen ? handleUpdateWorkout : handleAddWorkout} disabled={isLoading}>
              {isLoading ? "Saving..." : editDialogOpen ? "Save Changes" : "Log Workout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
