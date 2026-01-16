"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Plus, Trash2, Edit2, X, Upload, ImageIcon, Star, RefreshCw, Camera } from "lucide-react"
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
  onChangeImage?: (id: string, file: File) => Promise<void>
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
  onChangeImage,
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
  const [isChangingImage, setIsChangingImage] = useState(false)
  const changeImageInputRef = useRef<HTMLInputElement>(null)
  const cardChangeImageRef = useRef<HTMLInputElement>(null)

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

  const handleChangeImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedItem && onChangeImage) {
      setIsChangingImage(true)
      try {
        await onChangeImage(selectedItem.id, file)
        setDetailDialogOpen(false)
        setSelectedItem(null)
      } finally {
        setIsChangingImage(false)
      }
    }
    e.target.value = ""
  }

  const handleCardChangeImage = async (e: React.ChangeEvent<HTMLInputElement>, item: Item) => {
    const file = e.target.files?.[0]
    if (file && onChangeImage) {
      setIsChangingImage(true)
      try {
        await onChangeImage(item.id, file)
      } finally {
        setIsChangingImage(false)
      }
    }
    e.target.value = ""
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
      className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-muted"
    >
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-500 ease-out",
          hoveredItem === item.id && "scale-110",
        )}
      >
        <Image
          src={item.image_url || "/placeholder.svg"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
      </div>

      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300",
          hoveredItem === item.id ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Action buttons on hover */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 sm:p-4 transition-all duration-300",
          hoveredItem === item.id ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[50%]">{item.name}</span>
        <div className="flex gap-1">
          {onChangeImage && (
            <label>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
                onClick={(e) => e.stopPropagation()}
                asChild
              >
                <span>
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      e.stopPropagation()
                      handleCardChangeImage(e, item)
                    }}
                  />
                </span>
              </Button>
            </label>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
            onClick={(e) => handleEditClick(item, e)}
          >
            <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 bg-white/20 backdrop-blur-sm border-0 hover:bg-red-500/80"
            onClick={(e) => handleDeleteClick(item, e)}
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Rating badge */}
      {(item.metadata as any)?.rating && (
        <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium text-white">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {(item.metadata as any).rating}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
              {selectedCategory?.name || "All Items"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            </p>
          </div>
          <Button onClick={openAddDialog} disabled={categories.length === 0} size="sm" className="md:size-default">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Add Image</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 sm:py-20">
            <ImageIcon className="mb-4 h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50" />
            <p className="mb-2 text-base sm:text-lg font-medium text-foreground">No images yet</p>
            <p className="mb-4 text-sm text-muted-foreground text-center px-4">
              {categories.length === 0 ? "Create a category first, then add images" : "Upload images to get started"}
            </p>
            {categories.length > 0 && (
              <Button onClick={openAddDialog} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Add your first image
              </Button>
            )}
          </div>
        ) : selectedCategoryId ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map(renderItemCard)}
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {groupedItems?.map(({ category, items: categoryItems }) => (
              <section key={category.id}>
                <div className="mb-4 sm:mb-6 flex items-center gap-3">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">{category.name}</h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">
                    {categoryItems.length} {categoryItems.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted group">
                <Image
                  src={selectedItem.image_url || "/placeholder.svg"}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                />
                {/* Change image button */}
                {onChangeImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      onClick={() => changeImageInputRef.current?.click()}
                      disabled={isChangingImage}
                      className="bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
                    >
                      <RefreshCw className={cn("mr-2 h-4 w-4", isChangingImage && "animate-spin")} />
                      {isChangingImage ? "Changing..." : "Change Image"}
                    </Button>
                    <input
                      ref={changeImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleChangeImageFile}
                      className="hidden"
                    />
                  </div>
                )}
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
                placeholder="Enter item name"
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
                {categories
                  .filter((c) => c.type !== "fitness" && c.type !== "finance")
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Image</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50",
                  previewUrl ? "border-primary" : "border-border",
                )}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                {previewUrl ? (
                  <div className="relative aspect-video w-full max-w-xs mx-auto">
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      fill
                      className="object-cover rounded-md"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        if (previewUrl) URL.revokeObjectURL(previewUrl)
                        setPreviewUrl(null)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
              <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Dynamic metadata fields */}
            {newItemCategory && getSchemaFields(newItemCategory).length > 0 && (
              <div className="space-y-4 pt-2">
                <Label className="text-base">Additional Details</Label>
                {getSchemaFields(newItemCategory).map((field) => (
                  <div key={field.key} className="grid gap-2">
                    {field.type !== "checkbox" && <Label className="text-sm">{field.label}</Label>}
                    <MetadataField
                      field={field}
                      value={(newItemMetadata as any)?.[field.key]}
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
              {isLoading ? "Adding..." : "Add Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter item name"
              />
            </div>

            {/* Dynamic metadata fields for edit */}
            {selectedItem && getSchemaFields(selectedItem.category_id).length > 0 && (
              <div className="space-y-4 pt-2">
                <Label className="text-base">Additional Details</Label>
                {getSchemaFields(selectedItem.category_id).map((field) => (
                  <div key={field.key} className="grid gap-2">
                    {field.type !== "checkbox" && <Label className="text-sm">{field.label}</Label>}
                    <MetadataField
                      field={field}
                      value={(editMetadata as any)?.[field.key]}
                      onChange={handleEditMetadataChange}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setSelectedItem(null)
                setEditName("")
                setEditMetadata({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={!editName.trim() || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedItem?.name}&quot;? This action cannot be undone.
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
