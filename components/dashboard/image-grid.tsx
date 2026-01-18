"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Upload,
  ImageIcon,
  Star,
  RefreshCw,
  Camera,
  ArrowUpDown,
  Filter,
  Hash,
} from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Item, Category, ItemMetadata, CategoryType, SchemaField } from "@/lib/types"
import { CATEGORY_SCHEMAS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ImageGridProps {
  items: Item[]
  categories: Category[]
  selectedCategoryId: string | null
  onAddItem: (categoryId: string, name: string, file: File, metadata?: ItemMetadata, rank?: number) => Promise<void>
  onUpdateItem: (id: string, name: string, metadata?: ItemMetadata, rank?: number) => Promise<void>
  onDeleteItem: (id: string, imageUrl: string) => Promise<void>
  onChangeImage?: (id: string, file: File) => Promise<void>
  onItemFocused?: (focused: boolean) => void
}

type SortOption = "name" | "rating" | "year" | "date_added" | "rank"

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
  const [newItemRank, setNewItemRank] = useState<number | undefined>(undefined)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editMetadata, setEditMetadata] = useState<ItemMetadata>({})
  const [editRank, setEditRank] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isChangingImage, setIsChangingImage] = useState(false)
  const changeImageInputRef = useRef<HTMLInputElement>(null)

  const [sortBy, setSortBy] = useState<SortOption>("date_added")
  const [filterByMetadata, setFilterByMetadata] = useState<{ key: string; value: string } | null>(null)

  const selectedCategory = selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId) : null

  const supportsRanking =
    selectedCategory?.type === "movies" ||
    selectedCategory?.type === "tvshows" ||
    selectedCategory?.type === "music" ||
    selectedCategory?.type === "reading" ||
    selectedCategory?.type === "media"
  const supportsSorting = supportsRanking || selectedCategory?.type === "games"

  const baseFilteredItems = useMemo(() => {
    let filtered = selectedCategoryId ? items.filter((item) => item.category_id === selectedCategoryId) : items

    if (filterByMetadata) {
      filtered = filtered.filter((item) => {
        const metadata = item.metadata as any
        const value = metadata?.[filterByMetadata.key]
        if (typeof value === "string") {
          return value.toLowerCase() === filterByMetadata.value.toLowerCase()
        }
        return false
      })
    }

    return filtered
  }, [items, selectedCategoryId, filterByMetadata])

  const filteredItems = useMemo(() => {
    const sorted = [...baseFilteredItems]

    switch (sortBy) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "rating":
        sorted.sort((a, b) => {
          const ratingA = (a.metadata as any)?.rating || 0
          const ratingB = (b.metadata as any)?.rating || 0
          return ratingB - ratingA
        })
        break
      case "year":
        sorted.sort((a, b) => {
          const yearA = (a.metadata as any)?.year || 0
          const yearB = (b.metadata as any)?.year || 0
          return yearB - yearA
        })
        break
      case "rank":
        sorted.sort((a, b) => {
          const rankA = a.rank ?? 999
          const rankB = b.rank ?? 999
          return rankA - rankB
        })
        break
      case "date_added":
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return sorted
  }, [baseFilteredItems, sortBy])

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

  const categorySupportsRanking = (categoryId: string): boolean => {
    const type = getCategoryType(categoryId)
    return type === "movies" || type === "tvshows" || type === "music" || type === "reading" || type === "media"
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
      await onAddItem(newItemCategory, newItemName.trim(), selectedFile, newItemMetadata, newItemRank)
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
    setNewItemRank(undefined)
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const handleEditClick = (item: Item, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedItem(item)
    setEditName(item.name)
    setEditMetadata(item.metadata || {})
    setEditRank(item.rank)
    setEditDialogOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!selectedItem || !editName.trim()) return
    setIsLoading(true)
    try {
      await onUpdateItem(selectedItem.id, editName.trim(), editMetadata, editRank)
      setEditDialogOpen(false)
      setSelectedItem(null)
      setEditName("")
      setEditMetadata({})
      setEditRank(undefined)
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

  const handleMetadataClick = (key: string, value: string) => {
    setFilterByMetadata({ key, value })
    setDetailDialogOpen(false)
  }

  const clearFilter = () => {
    setFilterByMetadata(null)
  }

  const openAddDialog = () => {
    setNewItemCategory(selectedCategoryId || (categories[0]?.id ?? ""))
    setNewItemMetadata({})
    setNewItemRank(undefined)
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

  const isClickableMetadata = (key: string) => {
    return ["director", "artist", "genre", "creator", "author"].includes(key)
  }

  const renderItemCard = (item: Item) => (
    <div
      key={item.id}
      onClick={() => handleItemClick(item)}
      onMouseEnter={() => setHoveredItem(item.id)}
      onMouseLeave={() => setHoveredItem(null)}
      className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl bg-muted"
    >
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-700 ease-out",
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
          "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300",
          hoveredItem === item.id ? "opacity-100" : "opacity-0",
        )}
      />

      {item.rank && (
        <div className="absolute left-3 top-3 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
          {item.rank}
        </div>
      )}

      {/* Action buttons on hover */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 sm:p-5 transition-all duration-300",
          hoveredItem === item.id ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <span className="text-sm sm:text-base font-medium text-white truncate max-w-[60%]">{item.name}</span>
        <div className="flex gap-1.5">
          {onChangeImage && (
            <label>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
                onClick={(e) => e.stopPropagation()}
                asChild
              >
                <span>
                  <Camera className="h-4 w-4 text-white" />
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
            className="h-8 w-8 sm:h-9 sm:w-9 bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
            onClick={(e) => handleEditClick(item, e)}
          >
            <Edit2 className="h-4 w-4 text-white" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 bg-white/20 backdrop-blur-sm border-0 hover:bg-red-500/80"
            onClick={(e) => handleDeleteClick(item, e)}
          >
            <Trash2 className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Rating badge */}
      {(item.metadata as any)?.rating && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          {(item.metadata as any).rating}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="flex-1 overflow-auto p-5 sm:p-8 md:p-10 lg:p-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">
              {filterByMetadata ? `R{filterByMetadata.value}` : selectedCategory?.name || "All Items"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              {supportsRanking && " - Top 100 Ranking"}
              {filterByMetadata && (
                <button onClick={clearFilter} className="ml-2 text-primary hover:underline">
                  Clear filter
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {supportsSorting && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {supportsRanking && (
                    <DropdownMenuItem onClick={() => setSortBy("rank")}>
                      <Hash className="mr-2 h-4 w-4" />
                      Rank (Top 100) {sortBy === "rank" && "✓"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setSortBy("date_added")}>
                    Date Added {sortBy === "date_added" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    Name (A-Z) {sortBy === "name" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("rating")}>
                    Rating (High to Low) {sortBy === "rating" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("year")}>
                    Year (Newest) {sortBy === "year" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={openAddDialog} disabled={categories.length === 0} size="sm" className="md:size-default">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Add Image</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {filterByMetadata && (
          <div className="mb-6 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <Badge variant="secondary" className="gap-1">
              {filterByMetadata.key}: {filterByMetadata.value}
              <button onClick={clearFilter} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 sm:py-24">
            <ImageIcon className="mb-4 h-14 w-14 sm:h-18 sm:w-18 text-muted-foreground/50" />
            <p className="mb-2 text-lg sm:text-xl font-medium text-foreground">No images yet</p>
            <p className="mb-4 text-sm text-muted-foreground text-center px-4">
              {categories.length === 0
                ? "Create a category first, then add images"
                : filterByMetadata
                  ? "No items match this filter"
                  : supportsRanking
                    ? "Start building your Top 100 list"
                    : "Upload images to get started"}
            </p>
            {categories.length > 0 && !filterByMetadata && (
              <Button onClick={openAddDialog} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Add your first image
              </Button>
            )}
          </div>
        ) : selectedCategoryId ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map(renderItemCard)}
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {groupedItems?.map(({ category, items: categoryItems }) => (
              <section key={category.id}>
                <div className="mb-5 sm:mb-7 flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">{category.name}</h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">
                    {categoryItems.length} {categoryItems.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {categoryItems.map(renderItemCard)}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl border-0 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
          <button
            onClick={() => setDetailDialogOpen(false)}
            className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {selectedItem && (
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative aspect-[3/4] md:aspect-auto md:h-[70vh] overflow-hidden bg-muted group">
                <Image
                  src={selectedItem.image_url || "/placeholder.svg"}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                />
                {selectedItem.rank && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold shadow-lg">
                    <Hash className="h-4 w-4" />
                    Rank #{selectedItem.rank}
                  </div>
                )}
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

              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[50vh] md:max-h-[70vh]">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{selectedItem.name}</h2>
                  <p className="text-muted-foreground mt-1">
                    {categories.find((c) => c.id === selectedItem.category_id)?.name}
                  </p>
                </div>

                <div>
                  <h4 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Details</h4>
                  <div className="space-y-3">
                    {selectedItem.rank && (
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <span className="text-sm text-muted-foreground">Rank</span>
                        <span className="text-sm font-medium">#{selectedItem.rank} of 100</span>
                      </div>
                    )}
                    {getSchemaFields(selectedItem.category_id).map((field) => {
                      const value = (selectedItem.metadata as any)?.[field.key]
                      if (value === undefined || value === null || value === "") return null

                      const isClickable = isClickableMetadata(field.key) && typeof value === "string"

                      return (
                        <div key={field.key} className="flex justify-between items-center border-b border-border pb-3">
                          <span className="text-sm text-muted-foreground">{field.label}</span>
                          <span className="text-sm font-medium text-right">
                            {field.type === "rating" ? (
                              <RatingStars value={value} readonly />
                            ) : field.type === "progress" ? (
                              <span>{value}%</span>
                            ) : isClickable ? (
                              <button
                                onClick={() => handleMetadataClick(field.key, value)}
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {formatMetadataValue(field.key, value)}
                                <Filter className="h-3 w-3" />
                              </button>
                            ) : (
                              formatMetadataValue(field.key, value)
                            )}
                          </span>
                        </div>
                      )
                    })}
                    {Object.keys(selectedItem.metadata || {}).length === 0 && !selectedItem.rank && (
                      <p className="text-sm text-muted-foreground">No additional details</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
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
                  setNewItemRank(undefined)
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories
                  .filter((c) => c.type !== "fitness" && c.type !== "finance" && c.type !== "todos")
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            {newItemCategory && categorySupportsRanking(newItemCategory) && (
              <div className="grid gap-2">
                <Label htmlFor="rank">Rank (1-100)</Label>
                <Input
                  id="rank"
                  type="number"
                  min={1}
                  max={100}
                  value={newItemRank || ""}
                  onChange={(e) => setNewItemRank(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Enter rank position (optional)"
                />
                <p className="text-xs text-muted-foreground">Assign a position from 1 to 100 for your Top 100 list</p>
              </div>
            )}

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
            setEditRank(undefined)
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

            {selectedItem && categorySupportsRanking(selectedItem.category_id) && (
              <div className="grid gap-2">
                <Label htmlFor="edit-rank">Rank (1-100)</Label>
                <Input
                  id="edit-rank"
                  type="number"
                  min={1}
                  max={100}
                  value={editRank || ""}
                  onChange={(e) => setEditRank(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Enter rank position (optional)"
                />
                <p className="text-xs text-muted-foreground">Assign a position from 1 to 100 for your Top 100 list</p>
              </div>
            )}

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
                setEditRank(undefined)
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
