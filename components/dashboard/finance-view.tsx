"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  DollarSign,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { Transaction, Budget, SavingsGoal } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FinanceViewProps {
  categoryId: string
  transactions: Transaction[]
  budgets: Budget[]
  savingsGoals: SavingsGoal[]
  onAddTransaction: (transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) => Promise<void>
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>
  onDeleteTransaction: (id: string) => Promise<void>
  onAddBudget: (budget: Omit<Budget, "id" | "created_at" | "updated_at">) => Promise<void>
  onUpdateBudget: (id: string, budget: Partial<Budget>) => Promise<void>
  onDeleteBudget: (id: string) => Promise<void>
  onAddSavingsGoal: (goal: Omit<SavingsGoal, "id" | "created_at" | "updated_at">) => Promise<void>
  onUpdateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>
  onDeleteSavingsGoal: (id: string) => Promise<void>
}

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Personal Care",
  "Other",
]

const PAYMENT_METHODS = ["Cash", "Debit Card", "Credit Card", "Bank Transfer", "Mobile Payment", "Other"]

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#06b6d4", "#ec4899", "#eab308", "#64748b"]

export function FinanceView({
  categoryId,
  transactions,
  budgets,
  savingsGoals,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDeleteSavingsGoal,
}: FinanceViewProps) {
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [editTransactionOpen, setEditTransactionOpen] = useState(false)
  const [deleteTransactionOpen, setDeleteTransactionOpen] = useState(false)
  const [addBudgetOpen, setAddBudgetOpen] = useState(false)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [deleteGoalOpen, setDeleteGoalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [transactionForm, setTransactionForm] = useState({
    type: "expense" as "income" | "expense" | "transfer",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
    category_name: "",
    payment_method: "",
    notes: "",
  })

  const [budgetForm, setBudgetForm] = useState({
    budget_category: "",
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  const [goalForm, setGoalForm] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
  })

  // Financial calculations
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.transaction_date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const totalIncome = thisMonthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = thisMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const netSavings = totalIncome - totalExpenses

    const lastMonth = new Date(currentYear, currentMonth - 1, 1)
    const lastMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.transaction_date)
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
    })

    const lastMonthExpenses = lastMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const expenseChange = lastMonthExpenses > 0 ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0

    // Expense breakdown by category
    const expenseByCategory = thisMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, t) => {
          const cat = t.category_name || "Other"
          acc[cat] = (acc[cat] || 0) + t.amount
          return acc
        },
        {} as Record<string, number>,
      )

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      expenseChange,
      expenseByCategory,
      transactionCount: thisMonthTransactions.length,
    }
  }, [transactions])

  // Chart data - last 6 months
  const monthlyData = useMemo(() => {
    const months = [...Array(6)].map((_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const month = date.getMonth()
      const year = date.getFullYear()

      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.transaction_date)
        return tDate.getMonth() === month && tDate.getFullYear() === year
      })

      const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

      const expenses = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        income,
        expenses,
        savings: income - expenses,
      }
    })
    return months
  }, [transactions])

  // Pie chart data
  const pieData = useMemo(() => {
    return Object.entries(stats.expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
  }, [stats.expenseByCategory])

  // Budget vs actual
  const budgetComparison = useMemo(() => {
    const now = new Date()
    const currentBudgets = budgets.filter((b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear())

    return currentBudgets.map((budget) => {
      const spent = stats.expenseByCategory[budget.budget_category] || 0
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      return {
        category: budget.budget_category,
        budget: budget.amount,
        spent,
        percentage: Math.min(percentage, 100),
        remaining: Math.max(budget.amount - spent, 0),
        over: spent > budget.amount,
      }
    })
  }, [budgets, stats.expenseByCategory])

  const handleAddTransaction = async () => {
    if (!transactionForm.amount || !transactionForm.description) return
    setIsLoading(true)
    try {
      await onAddTransaction({
        category_id: categoryId,
        type: transactionForm.type,
        amount: Number.parseFloat(transactionForm.amount),
        description: transactionForm.description,
        transaction_date: transactionForm.transaction_date,
        category_name: transactionForm.category_name || undefined,
        payment_method: transactionForm.payment_method || undefined,
        notes: transactionForm.notes || undefined,
      })
      setAddTransactionOpen(false)
      resetTransactionForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction || !transactionForm.amount || !transactionForm.description) return
    setIsLoading(true)
    try {
      await onUpdateTransaction(selectedTransaction.id, {
        type: transactionForm.type,
        amount: Number.parseFloat(transactionForm.amount),
        description: transactionForm.description,
        transaction_date: transactionForm.transaction_date,
        category_name: transactionForm.category_name || undefined,
        payment_method: transactionForm.payment_method || undefined,
        notes: transactionForm.notes || undefined,
      })
      setEditTransactionOpen(false)
      setSelectedTransaction(null)
      resetTransactionForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return
    setIsLoading(true)
    try {
      await onDeleteTransaction(selectedTransaction.id)
      setDeleteTransactionOpen(false)
      setSelectedTransaction(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBudget = async () => {
    if (!budgetForm.budget_category || !budgetForm.amount) return
    setIsLoading(true)
    try {
      await onAddBudget({
        category_id: categoryId,
        budget_category: budgetForm.budget_category,
        amount: Number.parseFloat(budgetForm.amount),
        month: budgetForm.month,
        year: budgetForm.year,
      })
      setAddBudgetOpen(false)
      resetBudgetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGoal = async () => {
    if (!goalForm.name || !goalForm.target_amount) return
    setIsLoading(true)
    try {
      await onAddSavingsGoal({
        category_id: categoryId,
        name: goalForm.name,
        target_amount: Number.parseFloat(goalForm.target_amount),
        current_amount: Number.parseFloat(goalForm.current_amount) || 0,
        target_date: goalForm.target_date || undefined,
      })
      setAddGoalOpen(false)
      resetGoalForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return
    setIsLoading(true)
    try {
      await onDeleteSavingsGoal(selectedGoal.id)
      setDeleteGoalOpen(false)
      setSelectedGoal(null)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      category_name: transaction.category_name || "",
      payment_method: transaction.payment_method || "",
      notes: transaction.notes || "",
    })
    setEditTransactionOpen(true)
  }

  const resetTransactionForm = () => {
    setTransactionForm({
      type: "expense",
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
      category_name: "",
      payment_method: "",
      notes: "",
    })
  }

  const resetBudgetForm = () => {
    setBudgetForm({
      budget_category: "",
      amount: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    })
  }

  const resetGoalForm = () => {
    setGoalForm({
      name: "",
      target_amount: "",
      current_amount: "0",
      target_date: "",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Finance Tracker</h1>
          <p className="text-sm text-muted-foreground">Monitor your income, expenses, and savings goals</p>
        </div>
        <Button onClick={() => setAddTransactionOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(stats.totalExpenses)}</div>
            <div className="flex items-center gap-1 text-xs">
              {stats.expenseChange !== 0 && (
                <>
                  {stats.expenseChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-red-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-green-500" />
                  )}
                  <span className={stats.expenseChange > 0 ? "text-red-500" : "text-green-500"}>
                    {Math.abs(stats.expenseChange).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.netSavings >= 0 ? "text-blue-500" : "text-red-500")}>
              {formatCurrency(stats.netSavings)}
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings Goals</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(savingsGoals.reduce((sum, g) => sum + g.current_amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(savingsGoals.reduce((sum, g) => sum + g.target_amount, 0))} target
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Income vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>Last 6 months trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>This month by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Savings</CardTitle>
              <CardDescription>Net savings over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="savings" name="Net Savings" radius={[4, 4, 0, 0]}>
                      {monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.savings >= 0 ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CreditCard className="mb-4 h-16 w-16 text-muted-foreground/50" />
                  <p className="mb-2 text-lg font-medium">No transactions yet</p>
                  <p className="mb-4 text-sm text-muted-foreground">Start tracking your finances</p>
                  <Button onClick={() => setAddTransactionOpen(true)} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first transaction
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 20).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="group flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            transaction.type === "income" ? "bg-green-500/10" : "bg-red-500/10",
                          )}
                        >
                          {transaction.type === "income" ? (
                            <ArrowDownRight className="h-6 w-6 text-green-500" />
                          ) : (
                            <ArrowUpRight className="h-6 w-6 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {transaction.category_name && ` • ${transaction.category_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "text-lg font-semibold",
                            transaction.type === "income" ? "text-green-500" : "text-red-500",
                          )}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" onClick={() => openEditTransaction(transaction)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedTransaction(transaction)
                              setDeleteTransactionOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="budgets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Monthly Budgets</h2>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
            <Button onClick={() => setAddBudgetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </div>

          {budgetComparison.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Target className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <p className="mb-2 text-lg font-medium">No budgets set</p>
                <p className="mb-4 text-sm text-muted-foreground">Create budgets to track your spending</p>
                <Button onClick={() => setAddBudgetOpen(true)} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {budgetComparison.map((budget) => (
                <Card key={budget.category}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{budget.category}</CardTitle>
                      <span
                        className={cn("text-sm font-medium", budget.over ? "text-red-500" : "text-muted-foreground")}
                      >
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={budget.percentage} className={cn("h-2", budget.over && "[&>div]:bg-red-500")} />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>{budget.over ? "Over budget" : `${formatCurrency(budget.remaining)} remaining`}</span>
                      <span>{budget.percentage.toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Savings Goals</h2>
              <p className="text-sm text-muted-foreground">Track your progress towards financial goals</p>
            </div>
            <Button onClick={() => setAddGoalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>

          {savingsGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <PiggyBank className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <p className="mb-2 text-lg font-medium">No savings goals</p>
                <p className="mb-4 text-sm text-muted-foreground">Set goals to motivate your savings</p>
                <Button onClick={() => setAddGoalOpen(true)} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savingsGoals.map((goal) => {
                const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
                return (
                  <Card key={goal.id} className="group relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{goal.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedGoal(goal)
                            setDeleteGoalOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {goal.target_date && (
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-end justify-between">
                        <span className="text-2xl font-bold">{formatCurrency(goal.current_amount)}</span>
                        <span className="text-sm text-muted-foreground">of {formatCurrency(goal.target_amount)}</span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-3" />
                      <p className="mt-2 text-center text-sm text-muted-foreground">
                        {percentage.toFixed(1)}% complete
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Transaction Dialog */}
      <Dialog
        open={addTransactionOpen || editTransactionOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddTransactionOpen(false)
            setEditTransactionOpen(false)
            setSelectedTransaction(null)
            resetTransactionForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTransactionOpen ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
            <DialogDescription>
              {editTransactionOpen ? "Update your transaction details" : "Record a new income or expense"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={transactionForm.type === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTransactionForm((p) => ({ ...p, type: "income" }))}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Income
                </Button>
                <Button
                  type="button"
                  variant={transactionForm.type === "expense" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTransactionForm((p) => ({ ...p, type: "expense" }))}
                >
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Expense
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={transactionForm.transaction_date}
                  onChange={(e) => setTransactionForm((p) => ({ ...p, transaction_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g., Grocery shopping"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <select
                  value={transactionForm.category_name}
                  onChange={(e) => setTransactionForm((p) => ({ ...p, category_name: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Payment Method</Label>
                <select
                  value={transactionForm.payment_method}
                  onChange={(e) => setTransactionForm((p) => ({ ...p, payment_method: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any additional notes..."
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddTransactionOpen(false)
                setEditTransactionOpen(false)
                setSelectedTransaction(null)
                resetTransactionForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editTransactionOpen ? handleUpdateTransaction : handleAddTransaction}
              disabled={!transactionForm.amount || !transactionForm.description || isLoading}
            >
              {isLoading ? "Saving..." : editTransactionOpen ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Budget Dialog */}
      <Dialog open={addBudgetOpen} onOpenChange={setAddBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget</DialogTitle>
            <DialogDescription>Set a spending limit for a category</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <select
                value={budgetForm.budget_category}
                onChange={(e) => setBudgetForm((p) => ({ ...p, budget_category: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Monthly Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9"
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBudgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBudget} disabled={!budgetForm.budget_category || !budgetForm.amount || isLoading}>
              {isLoading ? "Creating..." : "Create Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Savings Goal</DialogTitle>
            <DialogDescription>Set a target to save towards</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Goal Name</Label>
              <Input
                placeholder="e.g., Emergency Fund, Vacation"
                value={goalForm.name}
                onChange={(e) => setGoalForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Target Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    value={goalForm.target_amount}
                    onChange={(e) => setGoalForm((p) => ({ ...p, target_amount: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Current Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    value={goalForm.current_amount}
                    onChange={(e) => setGoalForm((p) => ({ ...p, current_amount: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Target Date (optional)</Label>
              <Input
                type="date"
                value={goalForm.target_date}
                onChange={(e) => setGoalForm((p) => ({ ...p, target_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGoal} disabled={!goalForm.name || !goalForm.target_amount || isLoading}>
              {isLoading ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <AlertDialog open={deleteTransactionOpen} onOpenChange={setDeleteTransactionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Goal Dialog */}
      <AlertDialog open={deleteGoalOpen} onOpenChange={setDeleteGoalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedGoal?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
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
