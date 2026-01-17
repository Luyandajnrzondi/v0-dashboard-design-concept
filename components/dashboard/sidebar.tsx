"use client"

import type React from "react"
import type { SidebarProps } from "./types"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Folder,
  Trash2,
  Edit2,
  Check,
  X,
  Film,
  Music,
  BookOpen,
  Target,
  Dumbbell,
  Gamepad2,
  MapPin,
  Lightbulb,
  Briefcase,
  Wallet,
  LayoutGrid,
  Tv,
  CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import type { Category } from "@/lib/types"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  film: Film,
  tv: Tv,
  music: Music,
  "book-open": BookOpen,
  target: Target,
  dumbbell: Dumbbell,
  "gamepad-2": Gamepad2,
  "map-pin": MapPin,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  wallet: Wallet,
  "layout-grid": LayoutGrid,
  "check-square": CheckSquare,
}

const TYPE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  media: Film,
  movies: Film,
  tvshows: Tv,
  music: Music,
  reading: BookOpen,
  goals: Target,
  fitness: Dumbbell,
  games: Gamepad2,
  travel: MapPin,
  ideas: Lightbulb,
  career: Briefcase,
  finance: Wallet,
  todos: CheckSquare,
  general: Folder,
}

export function Sidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    setIsLoading(true)
    try {
      await onAddCategory(newCategoryName.trim())
      setNewCategoryName("")
      setIsAdding(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCategory = async (id: string) => {
    if (!editingName.trim()) return
    setIsLoading(true)
    try {
      await onUpdateCategory(id, editingName.trim())
      setEditingId(null)
      setEditingName("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return
    setIsLoading(true)
    try {
      await onDeleteCategory(categoryToDelete.id)
      if (selectedCategoryId === categoryToDelete.id) {
        onSelectCategory(null)
      }
    } finally {
      setIsLoading(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const startEditing = (category: Category) => {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  const getCategoryIcon = (category: Category) => {
    // First try to get icon from the icon field
    if (category.icon && ICON_MAP[category.icon]) {
      return ICON_MAP[category.icon]
    }
    // Fall back to type-based icon
    if (category.type && TYPE_ICON_MAP[category.type]) {
      return TYPE_ICON_MAP[category.type]
    }
    return Folder
  }

  return (
    <>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
          {!collapsed && <h2 className="text-sm font-semibold text-sidebar-foreground">Categories</h2>}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Categories List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* All Items option */}
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                selectedCategoryId === null
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">All Items</span>}
            </button>

            {/* Category items */}
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category)
              return (
                <div key={category.id} className="group relative">
                  {editingId === category.id ? (
                    <div className="flex items-center gap-1 px-1 py-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateCategory(category.id)
                          if (e.key === "Escape") setEditingId(null)
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleUpdateCategory(category.id)}
                        disabled={isLoading}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectCategory(category.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                        selectedCategoryId === category.id
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                      )}
                    >
                      <IconComponent className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate text-left">{category.name}</span>
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(category)
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(category)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Add Category */}
        <div className="border-t border-sidebar-border p-2">
          {isAdding && !collapsed ? (
            <div className="flex items-center gap-1">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory()
                  if (e.key === "Escape") setIsAdding(false)
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleAddCategory}
                disabled={isLoading}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setIsAdding(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-0",
              )}
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              {!collapsed && <span>Add Category</span>}
            </Button>
          )}
        </div>
      </aside>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This will also delete all images in this
              category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
