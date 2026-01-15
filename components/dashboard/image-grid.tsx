"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Trash2, Edit2, X, Upload, ImageIcon, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
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
import type { Item, Category, ItemMetadata, CategoryType, SchemaField } from "@/lib/types"
import { CATEGORY_SCHEMAS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ImageGridProps {
  items: Item[]
  categories: Category[]
  selectedCategoryId: string | null
  onAddItem: (categoryId: string, name: string, file: File, metadata?: ItemMetadata) => Promise<void>
  onUpdateItem: (id: string, name: string, metadata?: ItemMetadata) => Promise<void>
  onDeleteItem: (id: string, imageUrl: string) => Promise<void>
  onItemFocused?: (focused: boolean) => void
}

function RatingStars({
  value,
  onChange,
  readonly = false,
}: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn("transition-colors", readonly ? "cursor-default" : "cursor-pointer hover:text-yellow-400")}
        >
          <Star
            className={cn("h-5 w-5", star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
          />
        </button>
      ))}
    </div>
  )
}

function MetadataField({
  field,
  value,
  onChange,
}: {
  field: SchemaField
  value: any
  onChange: (key: string, value: any) => void
}) {
  switch (field.type) {
    case "text":
      return (
        <Input value={value || ""} onChange={(e) => onChange(field.key, e.target.value)} placeholder={field.label} />
      )
    case "number":
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value ? Number(e.target.value) : undefined)}
          placeholder={field.label}
        />
      )
    case "textarea":
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.label}
          rows={3}
        />
      )
    case "select":
      return (
        <select
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value || undefined)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1).replace("_", " ")}
            </option>
          ))}
        </select>
      )
    case "date":
      return (
        <Input type="date" value={value || ""} onChange={(e) => onChange(field.key, e.target.value || undefined)} />
      )
    case "rating":
      return <RatingStars value={value || 0} onChange={(v) => onChange(field.key, v)} />
    case "progress":
      return (
        <div className="flex items-center gap-3">
          <Slider
            value={[value || 0]}
            onValueChange={([v]) => onChange(field.key, v)}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="w-12 text-sm text-muted-foreground">{value || 0}%</span>
        </div>
      )
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox checked={value || false} onCheckedChange={(checked) => onChange(field.key, checked)} />
          <span className="text-sm">{field.label}</span>
        </div>
      )
    default:
      return null
  }
}

export function ImageGrid({
  items,
  categories,
  selectedCategoryId,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onItemFocused,
}: ImageGridProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const [newItemCategory, setNewItemCategory] = useState("")
  const [newItemMetadata, setNewItemMetadata] = useState<ItemMetadata>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editMetadata, setEditMetadata] = useState<ItemMetadata>({})
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const filteredItems = selectedCategoryId ? items.filter((item) => item.category_id === selectedCategoryId) : items

  const selectedCategory = selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId) : null

  const groupedItems = !selectedCategoryId
    ? categories.reduce(
        (acc, category) => {
          const categoryItems = items.filter((item) => item.category_id === category.id)
          if (categoryItems.length > 0) {
            acc.push({ category, items: categoryItems })
          }
          return acc
        },
        [] as { category: Category; items: Item[] }[],
      )
    : null

  useEffect(() => {
    onItemFocused?.(detailDialogOpen)
  }, [detailDialogOpen, onItemFocused])

  const getCategoryType = (categoryId: string): CategoryType => {
    const cat = categories.find((c) => c.id === categoryId)
    return (cat?.type as CategoryType) || "general"
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleAddItem = async () => {
    if (!newItemName.trim() || !selectedFile || !newItemCategory) return
    setIsLoading(true)
    try {
      await onAddItem(newItemCategory, newItemName.trim(), selectedFile, newItemMetadata)
      resetAddDialog()
    } finally {
      setIsLoading(false)
    }
  }

  const resetAddDialog = () => {
    setAddDialogOpen(false)
    setNewItemName("")
    setNewItemCategory("")
    setNewItemMetadata({})
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const handleEditClick = (item: Item, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedItem(item)
    setEditName(item.name)
    setEditMetadata(item.metadata || {})
    setEditDialogOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!selectedItem || !editName.trim()) return
    setIsLoading(true)
    try {
      await onUpdateItem(selectedItem.id, editName.trim(), editMetadata)
      setEditDialogOpen(false)
      setSelectedItem(null)
      setEditName("")
      setEditMetadata({})
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (item: Item, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedItem) return
    setIsLoading(true)
    try {
      await onDeleteItem(selectedItem.id, selectedItem.image_url)
      setDeleteDialogOpen(false)
      setDetailDialogOpen(false)
      setSelectedItem(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemClick = (item: Item) => {
    setSelectedItem(item)
    setDetailDialogOpen(true)
  }

  const openAddDialog = () => {
    setNewItemCategory(selectedCategoryId || (categories[0]?.id ?? ""))
    setNewItemMetadata({})
    setAddDialogOpen(true)
  }

  const handleMetadataChange = (key: string, value: any) => {
    setNewItemMetadata((prev) => ({ ...prev, [key]: value }))
  }

  const handleEditMetadataChange = (key: string, value: any) => {
    setEditMetadata((prev) => ({ ...prev, [key]: value }))
  }

  const getSchemaFields = (categoryId: string) => {
    const type = getCategoryType(categoryId)
    return CATEGORY_SCHEMAS[type]?.fields || []
  }

  const formatMetadataValue = (key: string, value: any): string => {
    if (value === undefined || value === null || value === "") return "-"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (Array.isArray(value)) return value.join(", ")
    return String(value)
  }

  const renderItemCard = (item: Item) => (
    <div
      key={item.id}
      onClick={() => handleItemClick(item)}
      onMouseEnter={() => setHoveredItem(item.id)}
      onMouseLeave={() => setHoveredItem(null)}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted"
    >
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={item.image_url || "/placeholder.svg"}
          alt={item.name}
          fill
          className={cn(
            "object-cover transition-transform duration-500 ease-out",
            hoveredItem === item.id && "scale-110",
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
      </div>

      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300",
          hoveredItem === item.id ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Action buttons on hover */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 transition-all duration-300",
          hoveredItem === item.id ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <span className="text-sm font-medium text-white truncate max-w-[60%]">{item.name}</span>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
            onClick={(e) => handleEditClick(item, e)}
          >
            <Edit2 className="h-3.5 w-3.5 text-white" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-white/20 backdrop-blur-sm border-0 hover:bg-red-500/80"
            onClick={(e) => handleDeleteClick(item, e)}
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </Button>
        </div>
      </div>

      {/* Rating badge */}
      {(item.metadata as any)?.rating && (
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-1 text-xs font-medium text-white">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {(item.metadata as any).rating}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">
              {selectedCategory?.name || "All Items"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            </p>
          </div>
          <Button onClick={openAddDialog} disabled={categories.length === 0} size="sm" className="md:size-default">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Add Image</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="mb-2 text-lg font-medium text-foreground">No images yet</p>
            <p className="mb-4 text-sm text-muted-foreground text-center px-4">
              {categories.length === 0 ? "Create a category first, then add images" : "Upload images to get started"}
            </p>
            {categories.length > 0 && (
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first image
              </Button>
            )}
          </div>
        ) : selectedCategoryId ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredItems.map(renderItemCard)}
          </div>
        ) : (
          <div className="space-y-8">
            {groupedItems?.map(({ category, items: categoryItems }) => (
              <section key={category.id}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">
                    {categoryItems.length} {categoryItems.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {categoryItems.map(renderItemCard)}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl border-0 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>
              {selectedItem && categories.find((c) => c.id === selectedItem.category_id)?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={selectedItem.image_url || "/placeholder.svg"}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Details</h4>
                  <div className="space-y-2">
                    {getSchemaFields(selectedItem.category_id).map((field) => {
                      const value = (selectedItem.metadata as any)?.[field.key]
                      if (value === undefined || value === null || value === "") return null
                      return (
                        <div key={field.key} className="flex justify-between border-b border-border pb-2">
                          <span className="text-sm text-muted-foreground">{field.label}</span>
                          <span className="text-sm font-medium">
                            {field.type === "rating" ? (
                              <RatingStars value={value} readonly />
                            ) : field.type === "progress" ? (
                              <span>{value}%</span>
                            ) : (
                              formatMetadataValue(field.key, value)
                            )}
                          </span>
                        </div>
                      )
                    })}
                    {Object.keys(selectedItem.metadata || {}).length === 0 && (
                      <p className="text-sm text-muted-foreground">No additional details</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setDetailDialogOpen(false)
                      handleEditClick(selectedItem)
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive bg-transparent"
                    onClick={() => {
                      handleDeleteClick(selectedItem)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Image Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => !open && resetAddDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
            <DialogDescription>Upload a new image to your dashboard</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Image name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newItemCategory}
                onChange={(e) => {
                  setNewItemCategory(e.target.value)
                  setNewItemMetadata({})
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Image</Label>
              <div className="flex flex-col items-center gap-4">
                {previewUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                    <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() => {
                        setSelectedFile(null)
                        if (previewUrl) URL.revokeObjectURL(previewUrl)
                        setPreviewUrl(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50">
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            {newItemCategory && getSchemaFields(newItemCategory).length > 0 && (
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-medium text-muted-foreground">Additional Details</h4>
                {getSchemaFields(newItemCategory).map((field) => (
                  <div key={field.key} className="grid gap-2">
                    {field.type !== "checkbox" && <Label>{field.label}</Label>}
                    <MetadataField
                      field={field}
                      value={newItemMetadata[field.key as keyof typeof newItemMetadata]}
                      onChange={handleMetadataChange}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetAddDialog}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!newItemName.trim() || !selectedFile || isLoading}>
              {isLoading ? "Uploading..." : "Add Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogOpen(false)
            setSelectedItem(null)
            setEditName("")
            setEditMetadata({})
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update the item details</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              {getSchemaFields(selectedItem.category_id).length > 0 && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Details</h4>
                  {getSchemaFields(selectedItem.category_id).map((field) => (
                    <div key={field.key} className="grid gap-2">
                      {field.type !== "checkbox" && <Label>{field.label}</Label>}
                      <MetadataField
                        field={field}
                        value={editMetadata[field.key as keyof typeof editMetadata]}
                        onChange={handleEditMetadataChange}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={!editName.trim() || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
