"use client"

import { useState } from "react"
import { Menu, Plus, Folder, Trash2, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

interface MobileSidebarProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (id: string | null) => void
  onAddCategory: (name: string) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onUpdateCategory: (id: string, name: string) => Promise<void>
}

export function MobileSidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
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

  const handleSelectCategory = (id: string | null) => {
    onSelectCategory(id)
    setOpen(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>Categories</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-2">
              {/* All Items */}
              <button
                onClick={() => handleSelectCategory(null)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  selectedCategoryId === null
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50",
                )}
              >
                <Folder className="h-4 w-4" />
                <span>All Items</span>
              </button>

              {/* Categories */}
              {categories.map((category) => (
                <div key={category.id} className="group relative">
                  {editingId === category.id ? (
                    <div className="flex items-center gap-1 px-1 py-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateCategory(category.id)}
                        disabled={isLoading}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectCategory(category.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        selectedCategoryId === category.id
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/50",
                      )}
                    >
                      <Folder className="h-4 w-4" />
                      <span className="flex-1 truncate text-left">{category.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(category.id)
                            setEditingName(category.name)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(category)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Add Category */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background p-2">
            {isAdding ? (
              <div className="flex items-center gap-1">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleAddCategory}
                  disabled={isLoading}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAdding(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4" />
                <span>Add Category</span>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This will also delete all images in this
              category.
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
