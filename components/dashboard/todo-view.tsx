"use client"

import { useState } from "react"
import { Plus, Trash2, Edit2, Calendar, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import type { Todo } from "@/lib/types"

interface TodoViewProps {
  todos: Todo[]
  onAddTodo: (todo: Omit<Todo, "id" | "created_at" | "updated_at">) => Promise<void>
  onUpdateTodo: (id: string, todo: Partial<Todo>) => Promise<void>
  onDeleteTodo: (id: string) => Promise<void>
}

const PRIORITY_COLORS = {
  low: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
}

const PRIORITY_FLAGS = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-red-500",
}

export function TodoView({ todos, onAddTodo, onUpdateTodo, onDeleteTodo }: TodoViewProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium")
  const [newDueDate, setNewDueDate] = useState("")

  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium")
  const [editDueDate, setEditDueDate] = useState("")

  const incompleteTodos = todos.filter((t) => !t.is_completed)
  const completedTodos = todos.filter((t) => t.is_completed)

  const resetAddDialog = () => {
    setAddDialogOpen(false)
    setNewTitle("")
    setNewDescription("")
    setNewPriority("medium")
    setNewDueDate("")
  }

  const handleAddTodo = async () => {
    if (!newTitle.trim()) return
    setIsLoading(true)
    try {
      await onAddTodo({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        is_completed: false,
        priority: newPriority,
        due_date: newDueDate || undefined,
      })
      resetAddDialog()
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (todo: Todo) => {
    setSelectedTodo(todo)
    setEditTitle(todo.title)
    setEditDescription(todo.description || "")
    setEditPriority(todo.priority)
    setEditDueDate(todo.due_date || "")
    setEditDialogOpen(true)
  }

  const handleUpdateTodo = async () => {
    if (!selectedTodo || !editTitle.trim()) return
    setIsLoading(true)
    try {
      await onUpdateTodo(selectedTodo.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        priority: editPriority,
        due_date: editDueDate || undefined,
      })
      setEditDialogOpen(false)
      setSelectedTodo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleComplete = async (todo: Todo) => {
    await onUpdateTodo(todo.id, { is_completed: !todo.is_completed })
  }

  const handleDeleteClick = (todo: Todo) => {
    setSelectedTodo(todo)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedTodo) return
    setIsLoading(true)
    try {
      await onDeleteTodo(selectedTodo.id)
      setDeleteDialogOpen(false)
      setSelectedTodo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const isOverdue = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const renderTodoItem = (todo: Todo) => (
    <div
      key={todo.id}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors",
        todo.is_completed && "opacity-60",
      )}
    >
      <button onClick={() => handleToggleComplete(todo)} className="mt-0.5 shrink-0">
        {todo.is_completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn("font-medium text-foreground", todo.is_completed && "line-through text-muted-foreground")}
          >
            {todo.title}
          </span>
          <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[todo.priority])}>
            {todo.priority}
          </Badge>
        </div>
        {todo.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{todo.description}</p>}
        {todo.due_date && (
          <div className="flex items-center gap-1 mt-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span
              className={cn(
                "text-xs",
                isOverdue(todo.due_date) && !todo.is_completed ? "text-red-500 font-medium" : "text-muted-foreground",
              )}
            >
              {isOverdue(todo.due_date) && !todo.is_completed ? "Overdue: " : "Due: "}
              {formatDate(todo.due_date)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(todo)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => handleDeleteClick(todo)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex-1 overflow-auto p-5 sm:p-8 md:p-10 lg:p-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">Todo List</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {incompleteTodos.length} pending, {completedTodos.length} completed
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Task
          </Button>
        </div>

        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20">
            <CheckCircle2 className="mb-4 h-14 w-14 text-muted-foreground/50" />
            <p className="mb-2 text-lg font-medium text-foreground">No tasks yet</p>
            <p className="mb-4 text-sm text-muted-foreground">Add tasks to track what you want to accomplish</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first task
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Tasks */}
            {incompleteTodos.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Pending Tasks</h2>
                <div className="space-y-3">
                  {incompleteTodos
                    .sort((a, b) => {
                      const priorityOrder = { high: 0, medium: 1, low: 2 }
                      return priorityOrder[a.priority] - priorityOrder[b.priority]
                    })
                    .map(renderTodoItem)}
                </div>
              </section>
            )}

            {/* Completed Tasks */}
            {completedTodos.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-muted-foreground mb-4">Completed</h2>
                <div className="space-y-3">{completedTodos.map(renderTodoItem)}</div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Add Todo Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => !open && resetAddDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Create a new task to track</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due-date">Due Date (optional)</Label>
                <Input id="due-date" type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetAddDialog}>
              Cancel
            </Button>
            <Button onClick={handleAddTodo} disabled={!newTitle.trim() || isLoading}>
              {isLoading ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Todo Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => !open && setEditDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <select
                  id="edit-priority"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as "low" | "medium" | "high")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-due-date">Due Date (optional)</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTodo} disabled={!editTitle.trim() || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedTodo?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
