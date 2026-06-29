
"use client"

import * as React from "react"
import { Wallet, TrendingUp, TrendingDown, Plus, Download, Filter, Landmark, Loader2, PieChart as PieIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
const CATEGORIES = [
  "Groceries", "Dining Out", "Travel", "School Fees", "Pocket Money", "Household", "Entertainment", "Income", "Other"
]

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function FinancesPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const [amount, setAmount] = React.useState("")
  const [type, setType] = React.useState("expense")
  const [category, setCategory] = React.useState("Other")
  const [description, setDescription] = React.useState("")

  const transactionsQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("family_transactions")
      .select("*")
      .eq("family_id", profile.family_id).order("date", { ascending: false })
  }, [supabase, profile?.family_id])

  const { data: transactions, loading: txLoading } = useCollection(transactionsQuery)

  const stats = React.useMemo(() => {
    if (!transactions) return { balance: 0, expenses: 0, categoryData: [] }
    const catMap: Record<string, number> = {}
    
    const totals = transactions.reduce((acc, tx) => {
      const val = parseFloat(tx.amount || "0")
      if (tx.type === "income" || tx.type === "allowance") {
        acc.balance += val
      } else {
        acc.balance -= val
        acc.expenses += val
        catMap[tx.category] = (catMap[tx.category] || 0) + val
      }
      return acc
    }, { balance: 0, expenses: 0 })

    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
    return { ...totals, categoryData }
  }, [transactions])

  const handleAddTransaction = async () => {
    if (!supabase || !profile?.family_id || !amount) return

    setLoading(true)
    const txData = {
      family_id: profile.family_id,
      user_id: profile.id,
      user_name: profile.first_name || "Family Member",
      amount: parseFloat(amount),
      type,
      category,
      description,
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("family_transactions").insert([txData])
    setLoading(false)
    if (!error) {
      setIsDialogOpen(false)
      setAmount("")
      setDescription("")
      toast({
        title: "Transaction Logged",
        description: `R ${parseFloat(amount).toFixed(2)} recorded successfully.`,
      })
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const [isDistributing, setIsDistributing] = React.useState(false)
  const handleDistributeAllowance = async () => {
    setIsDistributing(true)
    // Stub for now
    setTimeout(() => setIsDistributing(false), 1000)
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Finances & Allowances</h1>
          <p className="text-muted-foreground font-medium">Tracking the Kapendeka Family wealth in ZAR</p>
        </div>
        <div className="flex items-center gap-2">
          
          {profile?.role === 'parent' && (
            <Button onClick={handleDistributeAllowance} disabled={isDistributing} className="rounded-xl h-11 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
              {isDistributing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />} Distribute Allowances
            </Button>
          )}

          {profile?.role === 'parent' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl h-11 px-6 font-bold bg-accent shadow-lg shadow-accent/20">
                  <Plus className="h-4 w-4 mr-2" /> Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>New Transaction</DialogTitle>
                  <DialogDescription>Record a new expense or income for the family hub.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (ZAR)</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="0.00" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income / Allowance</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Input 
                      id="desc" 
                      placeholder="e.g. Weekly Shop" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTransaction} disabled={!amount || loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Log Transaction
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="rounded-3xl border-none shadow-xl bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R {stats.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium bg-white/10 w-fit px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" /> Family Ledger
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-3xl border-none shadow-sm bg-white lg:col-span-2 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <PieIcon className="h-4 w-4" />
                Spending Breakdown
              </h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-muted/20 p-6 flex flex-col justify-center border-l">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Expenses</div>
              <div className="text-3xl font-bold mt-1 text-rose-500">R {stats.expenses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase">Top Category</p>
              <Badge className="w-fit bg-primary/10 text-primary border-none mt-1">
                {stats.categoryData.length > 0 ? stats.categoryData.sort((a: any, b: any) => b.value - a.value)[0].name : "None"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
            <CardDescription className="font-medium">All household spending and income</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="font-bold text-primary">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-bold text-primary">Date</TableHead>
                <TableHead className="font-bold text-primary">Description</TableHead>
                <TableHead className="font-bold text-primary">Category</TableHead>
                <TableHead className="text-right font-bold text-primary">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : transactions?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-5 text-muted-foreground">No transactions logged yet.</TableCell></TableRow>
              ) : (
                transactions?.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-xs md:text-sm">{format(new Date(tx.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="font-bold">{tx.description}</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">{tx.category} • {tx.user_name}</div>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${tx.type === 'income' || tx.type === 'allowance' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {tx.type === 'income' || tx.type === 'allowance' ? '+' : '-'} R {Math.abs(tx.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
