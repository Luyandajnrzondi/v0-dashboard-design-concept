"use client"

import { useState, useMemo } from "react"
import { Plus, Trash2, Edit2, Calendar, Dumbbell, Flame, Clock, TrendingUp, Moon, Zap, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
  ComposedChart,
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
const MOOD_OPTIONS = ["Excellent", "Good", "Okay", "Tired", "Stressed"]
const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Full Body"]

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

  const [formData, setFormData] = useState<{
    workout_date: string
    workout_type: string
    exercises: Exercise[]
    duration_minutes: number
    calories_burned: number
    notes: string
    rpe: number
    sleep_quality: number
  }>({
    workout_date: new Date().toISOString().split("T")[0],
    workout_type: "Strength",
    exercises: [{ name: "", sets: 3, reps: 10, weight: 0 }],
    duration_minutes: 60,
    calories_burned: 300,
    notes: "",
    rpe: 7,
    sleep_quality: 3,
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

    // Best workout (highest calories)
    const bestWorkout = last30Days.reduce(
      (best, w) => ((w.calories_burned || 0) > (best?.calories_burned || 0) ? w : best),
      null as WorkoutLog | null,
    )

    // Average workout duration
    const avgDuration = last30Days.length > 0 ? Math.round(totalDuration / last30Days.length) : 0

    // Personal records from all time
    const allTimeVolume = workoutLogs.reduce((sum, w) => {
      const workoutVolume = w.exercises.reduce((exSum, ex) => exSum + ex.sets * ex.reps * (ex.weight || 0), 0)
      return sum + workoutVolume
    }, 0)

    // Weekly goal progress (assuming 4 workouts per week goal)
    const weeklyGoal = 4
    const weeklyProgress = Math.min((last7Days.length / weeklyGoal) * 100, 100)

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
      avgDuration,
      bestWorkout,
      allTimeVolume,
      weeklyProgress,
      weeklyGoal,
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
        volume: dayWorkouts.reduce(
          (sum, w) => sum + w.exercises.reduce((exSum, ex) => exSum + ex.sets * ex.reps * (ex.weight || 0), 0),
          0,
        ),
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
        totalVolume: weekWorkouts.reduce(
          (sum, w) => sum + w.exercises.reduce((exSum, ex) => exSum + ex.sets * ex.reps * (ex.weight || 0), 0),
          0,
        ),
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

  // Exercise frequency data
  const exerciseFrequency = useMemo(() => {
    const exerciseCounts: Record<string, number> = {}
    workoutLogs.forEach((w) => {
      w.exercises.forEach((ex) => {
        if (ex.name) {
          exerciseCounts[ex.name] = (exerciseCounts[ex.name] || 0) + 1
        }
      })
    })
    return Object.entries(exerciseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
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
    })
  }

  const chartColors = {
    calories: "#f97316",
    duration: "#3b82f6",
    workouts: "#22c55e",
    rpe: "#8b5cf6",
    sleep: "#06b6d4",
    volume: "#ec4899",
  }

  return (
    <div className="flex-1 overflow-auto p-5 sm:p-8 md:p-10 lg:p-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">Gym & Fitness</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your workouts, health metrics, and progress</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Log Workout
        </Button>
      </div>

      {/* Stats Cards - Expanded */}
      {stats && (
        <div className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <Card className="col-span-2 sm:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Weekly Goal</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.workoutsThisWeek}/{stats.weeklyGoal}
              </div>
              <Progress value={stats.weeklyProgress} className="mt-2 h-2" />
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
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
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
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
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
                      <Line
                        type="monotone"
                        dataKey="duration"
                        name="Duration (min)"
                        stroke={chartColors.duration}
                        strokeWidth={2}
                      />
                    </ComposedChart>
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
                <div className="h-80">
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
                <div className="h-80">
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
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Exercises</CardTitle>
                <CardDescription>Most frequently performed exercises</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exerciseFrequency} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" name="Times" fill={chartColors.volume} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Weekly comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Comparison</CardTitle>
              <CardDescription>Compare your performance across weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
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
                    <Legend />
                    <Bar dataKey="workouts" name="Workouts" fill={chartColors.workouts} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalCalories" name="Calories" fill={chartColors.calories} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Volume Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Trend</CardTitle>
              <CardDescription>Total weight lifted over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${(value / 1000).toFixed(1)}k kg`, "Volume"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      name="Volume (kg)"
                      stroke={chartColors.volume}
                      fill={chartColors.volume}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Consistency
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">This Week</span>
                      <span className="font-medium">{stats.workoutsThisWeek} workouts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">This Month</span>
                      <span className="font-medium">{stats.workoutsThisMonth} workouts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Streak</span>
                      <span className="font-medium">{stats.currentStreak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Duration</span>
                      <span className="font-medium">{stats.avgDuration} min</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-purple-500" />
                      Strength
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Volume</span>
                      <span className="font-medium">{(stats.totalVolume / 1000).toFixed(1)}k kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">All-Time Volume</span>
                      <span className="font-medium">{(stats.allTimeVolume / 1000).toFixed(1)}k kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg RPE</span>
                      <span className="font-medium">{stats.avgRpe}/10</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Moon className="h-5 w-5 text-cyan-500" />
                      Recovery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Sleep Quality</span>
                      <span className="font-medium">{stats.avgSleep}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Calories</span>
                      <span className="font-medium">{stats.totalCalories.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Duration</span>
                      <span className="font-medium">{Math.round(stats.totalDuration / 60)}h</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
              <CardDescription>Your recent workout sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-foreground">No workouts logged yet</p>
                  <p className="text-sm text-muted-foreground">Start tracking your fitness journey</p>
                  <Button onClick={() => setAddDialogOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Log Your First Workout
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {workoutLogs.slice(0, 10).map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
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
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium">{workout.duration_minutes} min</p>
                          <p className="text-xs text-muted-foreground">{workout.calories_burned} cal</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(workout)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedWorkout(workout)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Workout Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
            <DialogDescription>Record your training session details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Exercises</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddExercise}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Exercise
                </Button>
              </div>
              {formData.exercises.map((exercise, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Input
                      placeholder="Exercise name"
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Sets"
                      value={exercise.sets}
                      onChange={(e) => handleExerciseChange(index, "sets", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={exercise.reps}
                      onChange={(e) => handleExerciseChange(index, "reps", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Weight (kg)"
                      value={exercise.weight || ""}
                      onChange={(e) => handleExerciseChange(index, "weight", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    {formData.exercises.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveExercise(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Duration (minutes)</Label>
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

            <div className="grid gap-2">
              <Label>RPE (Rate of Perceived Exertion): {formData.rpe}/10</Label>
              <Slider
                value={[formData.rpe]}
                onValueChange={([value]) => setFormData((prev) => ({ ...prev, rpe: value }))}
                max={10}
                min={1}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Sleep Quality Last Night: {formData.sleep_quality}/5</Label>
              <Slider
                value={[formData.sleep_quality]}
                onValueChange={([value]) => setFormData((prev) => ({ ...prev, sleep_quality: value }))}
                max={5}
                min={1}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="How did you feel? Any personal records?"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWorkout} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Workout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workout</DialogTitle>
            <DialogDescription>Update your workout details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Exercises</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddExercise}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Exercise
                </Button>
              </div>
              {formData.exercises.map((exercise, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Input
                      placeholder="Exercise name"
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Sets"
                      value={exercise.sets}
                      onChange={(e) => handleExerciseChange(index, "sets", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={exercise.reps}
                      onChange={(e) => handleExerciseChange(index, "reps", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Weight (kg)"
                      value={exercise.weight || ""}
                      onChange={(e) => handleExerciseChange(index, "weight", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    {formData.exercises.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveExercise(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Duration (minutes)</Label>
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

            <div className="grid gap-2">
              <Label>RPE (Rate of Perceived Exertion): {formData.rpe}/10</Label>
              <Slider
                value={[formData.rpe]}
                onValueChange={([value]) => setFormData((prev) => ({ ...prev, rpe: value }))}
                max={10}
                min={1}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Sleep Quality Last Night: {formData.sleep_quality}/5</Label>
              <Slider
                value={[formData.sleep_quality]}
                onValueChange={([value]) => setFormData((prev) => ({ ...prev, sleep_quality: value }))}
                max={5}
                min={1}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="How did you feel? Any personal records?"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWorkout} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
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
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
