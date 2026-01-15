"use client"

import { useState, useMemo } from "react"
import { Plus, Trash2, Edit2, Calendar, Dumbbell, Flame, Clock, TrendingUp, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { WorkoutLog, Exercise } from "@/lib/types"

interface FitnessViewProps {
  categoryId: string
  workoutLogs: WorkoutLog[]
  onAddWorkout: (workout: Omit<WorkoutLog, "id" | "created_at" | "updated_at">) => Promise<void>
  onUpdateWorkout: (id: string, workout: Partial<WorkoutLog>) => Promise<void>
  onDeleteWorkout: (id: string) => Promise<void>
}

const WORKOUT_TYPES = ["Strength", "Cardio", "HIIT", "Yoga", "Sports", "Other"]

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

  // Form state
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

  // Stats calculations
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

    return {
      workoutsThisWeek: last7Days.length,
      workoutsThisMonth: last30Days.length,
      totalCalories,
      totalDuration,
      avgRpe: avgRpe.toFixed(1),
    }
  }, [workoutLogs])

  // Chart data
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
      }
    })
    return last14Days
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
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gym & Fitness</h1>
          <p className="text-sm text-muted-foreground">Track your workouts and progress</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Workout
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workoutsThisWeek}</div>
              <p className="text-xs text-muted-foreground">workouts completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calories Burned</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.totalDuration / 60)}h</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Effort (RPE)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRpe}/10</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Workouts and calories over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duration Trend</CardTitle>
            <CardDescription>Minutes trained over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                  <Line
                    type="monotone"
                    dataKey="duration"
                    name="Duration (min)"
                    stroke={chartColors.duration}
                    strokeWidth={2}
                    dot={{ fill: chartColors.duration }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workout Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
          <CardDescription>Your workout history</CardDescription>
        </CardHeader>
        <CardContent>
          {workoutLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="mb-2 text-lg font-medium">No workouts logged yet</p>
              <p className="mb-4 text-sm text-muted-foreground">Start tracking your fitness journey</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log your first workout
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workoutLogs.slice(0, 10).map((workout) => (
                <div
                  key={workout.id}
                  className="group flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Dumbbell className="h-5 w-5 text-primary" />
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
                <div key={index} className="grid grid-cols-12 gap-2 rounded-lg border border-border p-3">
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
