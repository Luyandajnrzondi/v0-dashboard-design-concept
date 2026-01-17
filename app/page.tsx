"use client"

import { useEffect, useState, useCallback } from "react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { ImageGrid } from "@/components/dashboard/image-grid"
import { FitnessView } from "@/components/dashboard/fitness-view"
import { FinanceView } from "@/components/dashboard/finance-view"
import { TodoView } from "@/components/dashboard/todo-view"
import type { Category, Item, ItemMetadata, WorkoutLog, Transaction, Budget, SavingsGoal, Todo } from "@/lib/types"
import { cn } from "@/lib/utils"

const supabase = createClient()

// SWR fetchers
const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: true })
  if (error) throw error
  return data || []
}

const fetchItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

const fetchWorkoutLogs = async (): Promise<WorkoutLog[]> => {
  const { data, error } = await supabase.from("workout_logs").select("*").order("workout_date", { ascending: false })
  if (error) throw error
  return data || []
}

const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
  if (error) throw error
  return data || []
}

const fetchBudgets = async (): Promise<Budget[]> => {
  const { data, error } = await supabase.from("budgets").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

const fetchSavingsGoals = async (): Promise<SavingsGoal[]> => {
  const { data, error } = await supabase.from("savings_goals").select("*").order("target_date", { ascending: true })
  if (error) throw error
  return data || []
}

const fetchTodos = async (): Promise<Todo[]> => {
  const { data, error } = await supabase.from("todos").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export default function DashboardPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isItemFocused, setIsItemFocused] = useState(false)

  const {
    data: categories = [],
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useSWR("categories", fetchCategories)
  const { data: items = [], error: itemsError, isLoading: itemsLoading } = useSWR("items", fetchItems)
  const {
    data: workoutLogs = [],
    error: workoutError,
    isLoading: workoutLoading,
  } = useSWR("workout_logs", fetchWorkoutLogs)

  const {
    data: transactions = [],
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useSWR("transactions", fetchTransactions)
  const { data: budgets = [], error: budgetsError, isLoading: budgetsLoading } = useSWR("budgets", fetchBudgets)
  const {
    data: savingsGoals = [],
    error: goalsError,
    isLoading: goalsLoading,
  } = useSWR("savings_goals", fetchSavingsGoals)

  const { data: todos = [], error: todosError, isLoading: todosLoading } = useSWR("todos", fetchTodos)

  // Subscribe to realtime updates
  useEffect(() => {
    const categoriesChannel = supabase
      .channel("categories-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        mutate("categories")
      })
      .subscribe()

    const itemsChannel = supabase
      .channel("items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        mutate("items")
      })
      .subscribe()

    const workoutChannel = supabase
      .channel("workout-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_logs" }, () => {
        mutate("workout_logs")
      })
      .subscribe()

    const transactionsChannel = supabase
      .channel("transactions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        mutate("transactions")
      })
      .subscribe()

    const budgetsChannel = supabase
      .channel("budgets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => {
        mutate("budgets")
      })
      .subscribe()

    const goalsChannel = supabase
      .channel("goals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_goals" }, () => {
        mutate("savings_goals")
      })
      .subscribe()

    const todosChannel = supabase
      .channel("todos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "todos" }, () => {
        mutate("todos")
      })
      .subscribe()

    return () => {
      supabase.removeChannel(categoriesChannel)
      supabase.removeChannel(itemsChannel)
      supabase.removeChannel(workoutChannel)
      supabase.removeChannel(transactionsChannel)
      supabase.removeChannel(budgetsChannel)
      supabase.removeChannel(goalsChannel)
      supabase.removeChannel(todosChannel)
    }
  }, [])

  // Category CRUD operations
  const handleAddCategory = useCallback(async (name: string) => {
    const { error } = await supabase.from("categories").insert({ name })
    if (error) throw error
    mutate("categories")
  }, [])

  const handleUpdateCategory = useCallback(async (id: string, name: string) => {
    const { error } = await supabase
      .from("categories")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
    mutate("categories")
  }, [])

  const handleDeleteCategory = useCallback(async (id: string) => {
    const { data: categoryItems } = await supabase.from("items").select("image_url").eq("category_id", id)

    if (categoryItems && categoryItems.length > 0) {
      const filePaths = categoryItems
        .map((item) => {
          const url = item.image_url
          const match = url.match(/dashboard-images\/(.+)$/)
          return match ? match[1] : null
        })
        .filter(Boolean) as string[]

      if (filePaths.length > 0) {
        await supabase.storage.from("dashboard-images").remove(filePaths)
      }
    }

    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) throw error
    mutate("categories")
    mutate("items")
  }, [])

  const handleAddItem = useCallback(
    async (categoryId: string, name: string, file: File, metadata?: ItemMetadata, rank?: number) => {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from("dashboard-images").upload(filePath, file)
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("dashboard-images").getPublicUrl(filePath)

      const { error } = await supabase.from("items").insert({
        category_id: categoryId,
        name,
        type: "image",
        image_url: publicUrl,
        metadata: metadata || {},
        rank: rank || null,
      })
      if (error) throw error
      mutate("items")
    },
    [],
  )

  const handleUpdateItem = useCallback(async (id: string, name: string, metadata?: ItemMetadata, rank?: number) => {
    const { error } = await supabase
      .from("items")
      .update({
        name,
        metadata: metadata || {},
        rank: rank || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    if (error) throw error
    mutate("items")
  }, [])

  const handleDeleteItem = useCallback(async (id: string, imageUrl: string) => {
    const match = imageUrl.match(/dashboard-images\/(.+)$/)
    if (match) {
      await supabase.storage.from("dashboard-images").remove([match[1]])
    }

    const { error } = await supabase.from("items").delete().eq("id", id)
    if (error) throw error
    mutate("items")
  }, [])

  const handleChangeImage = useCallback(async (id: string, file: File) => {
    const { data: currentItem } = await supabase.from("items").select("image_url").eq("id", id).single()

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage.from("dashboard-images").upload(filePath, file)
    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from("dashboard-images").getPublicUrl(filePath)

    const { error } = await supabase
      .from("items")
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error

    if (currentItem?.image_url) {
      const match = currentItem.image_url.match(/dashboard-images\/(.+)$/)
      if (match) {
        await supabase.storage.from("dashboard-images").remove([match[1]])
      }
    }

    mutate("items")
  }, [])

  const handleAddWorkout = useCallback(async (workout: Omit<WorkoutLog, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("workout_logs").insert(workout)
    if (error) throw error
    mutate("workout_logs")
  }, [])

  const handleUpdateWorkout = useCallback(async (id: string, workout: Partial<WorkoutLog>) => {
    const { error } = await supabase
      .from("workout_logs")
      .update({ ...workout, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
    mutate("workout_logs")
  }, [])

  const handleDeleteWorkout = useCallback(async (id: string) => {
    const { error } = await supabase.from("workout_logs").delete().eq("id", id)
    if (error) throw error
    mutate("workout_logs")
  }, [])

  const handleAddTransaction = useCallback(
    async (transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("transactions").insert(transaction)
      if (error) throw error
      mutate("transactions")
    },
    [],
  )

  const handleUpdateTransaction = useCallback(async (id: string, transaction: Partial<Transaction>) => {
    const { error } = await supabase
      .from("transactions")
      .update({ ...transaction, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
    mutate("transactions")
  }, [])

  const handleDeleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (error) throw error
    mutate("transactions")
  }, [])

  const handleAddBudget = useCallback(async (budget: Omit<Budget, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("budgets").insert(budget)
    if (error) throw error
    mutate("budgets")
  }, [])

  const handleUpdateBudget = useCallback(async (id: string, budget: Partial<Budget>) => {
    const { error } = await supabase
      .from("budgets")
      .update({ ...budget, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
    mutate("budgets")
  }, [])

  const handleDeleteBudget = useCallback(async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id)
    if (error) throw error
    mutate("budgets")
  }, [])

  const handleAddSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("savings_goals").insert(goal)
    if (error) throw error
    mutate("savings_goals")
  }, [])

  const handleUpdateSavingsGoal = useCallback(async (id: string, goal: Partial<SavingsGoal>) => {
    const { error } = await supabase
      .from("savings_goals")
      .update({ ...goal, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
    mutate("savings_goals")
  }, [])

  const handleDeleteSavingsGoal = useCallback(async (id: string) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", id)
    if (error) throw error
    mutate("savings_goals")
  }, [])

  const handleAddTodo = useCallback(async (todo: Omit<Todo, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("todos").insert(todo)
    if (error) throw error
    mutate("todos")
  }, [])

  const handleUpdateTodo = useCallback(async (id: string, todo: Partial<Todo>) => {
    const { error } = await supabase
      .from("todos")
      .update({ ...todo, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
    mutate("todos")
  }, [])

  const handleDeleteTodo = useCallback(async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id)
    if (error) throw error
    mutate("todos")
  }, [])

  const selectedCategory = selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId) : null
  const isFitnessCategory = selectedCategory?.type === "fitness"
  const isFinanceCategory = selectedCategory?.type === "finance"
  const isTodosCategory = selectedCategory?.type === "todos"

  const hasError =
    categoriesError || itemsError || workoutError || transactionsError || budgetsError || goalsError || todosError
  const isLoading =
    categoriesLoading ||
    itemsLoading ||
    workoutLoading ||
    transactionsLoading ||
    budgetsLoading ||
    goalsLoading ||
    todosLoading

  if (hasError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Something went wrong</p>
          <p className="text-sm text-muted-foreground">Please run the SQL scripts to set up the database</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <div
        className={cn(
          "hidden md:block transition-all duration-300",
          isItemFocused && "blur-sm opacity-50 pointer-events-none",
        )}
      >
        <Sidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onUpdateCategory={handleUpdateCategory}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header
          className={cn(
            "flex h-14 items-center gap-4 border-b border-border px-4 md:hidden transition-all duration-300",
            isItemFocused && "blur-sm opacity-50 pointer-events-none",
          )}
        >
          <MobileSidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateCategory={handleUpdateCategory}
          />
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        </header>

        {isTodosCategory ? (
          <TodoView
            todos={todos}
            onAddTodo={handleAddTodo}
            onUpdateTodo={handleUpdateTodo}
            onDeleteTodo={handleDeleteTodo}
          />
        ) : isFinanceCategory && selectedCategoryId ? (
          <FinanceView
            categoryId={selectedCategoryId}
            transactions={transactions.filter((t) => t.category_id === selectedCategoryId)}
            budgets={budgets.filter((b) => b.category_id === selectedCategoryId)}
            savingsGoals={savingsGoals.filter((g) => g.category_id === selectedCategoryId)}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
            onAddSavingsGoal={handleAddSavingsGoal}
            onUpdateSavingsGoal={handleUpdateSavingsGoal}
            onDeleteSavingsGoal={handleDeleteSavingsGoal}
          />
        ) : isFitnessCategory && selectedCategoryId ? (
          <FitnessView
            categoryId={selectedCategoryId}
            workoutLogs={workoutLogs.filter((w) => w.category_id === selectedCategoryId)}
            onAddWorkout={handleAddWorkout}
            onUpdateWorkout={handleUpdateWorkout}
            onDeleteWorkout={handleDeleteWorkout}
          />
        ) : (
          <ImageGrid
            items={items}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onChangeImage={handleChangeImage}
            onItemFocused={setIsItemFocused}
          />
        )}
      </div>
    </div>
  )
}
