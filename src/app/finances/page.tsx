"use client"

import * as React from "react"
import { Wallet, TrendingUp, TrendingDown, Plus, Download, Filter, Landmark, Loader2 } from "lucide-react"
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
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

const CATEGORIES = [
  "Groceries", "Dining Out", "Travel", "School Fees", "Pocket Money", "Household", "Entertainment", "Income", "Other"
]

export default function FinancesPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  // Form State
  const [amount, setAmount] = React.useState("")
  const [type, setType] = React.useState("expense")
  const [category, setCategory] = React.useState("Other")
  const [description, setDescription] = React.useState("")

  const transactionsQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(
      collection(db, "transactions"),
      where("familyId", "==", profile.familyId),
      orderBy("date", "desc")
    )
  }, [db, profile?.familyId])

  const { data: transactions, loading: txLoading } = useCollection(transactionsQuery)

  const stats = React.useMemo(() => {
    if (!transactions) return { balance: 0, expenses: 0 }
    return transactions.reduce((acc, tx) => {
      const val = parseFloat(tx.amount || "0")
      if (tx.type === "income" || tx.type === "allowance") {
        acc.balance += val
      } else {
        acc.balance -= val
        acc.expenses += val
      }
      return acc
    }, { balance: 0, expenses: 0 })
  }, [transactions])

  const handleAddTransaction = () => {
    if (!db || !profile?.familyId || !amount) return

    setLoading(true)
    const txData = {
      familyId: profile.familyId,
      userId: profile.id,
      amount: parseFloat(amount),
      type: type,
      category: category,
      description: description,
      date: serverTimestamp(),
    }

    addDoc(collection(db, "transactions"), txData)
      .then(() => {
        setIsDialogOpen(false)
        setAmount("")
        setDescription("")
        toast({
          title: "Transaction Logged",
          description: `R ${parseFloat(amount).toFixed(2)} recorded successfully.`,
        })
      })
      .catch((err) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: "transactions",
          operation: "create",
          requestResourceData: txData
        }))
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Finances & Allowances</h1>
          <p className="text-muted-foreground font-medium">Tracking the Kapendeka Family wealth in ZAR</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    placeholder="e.g. Weekly Shop at Woolies" 
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
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <Card className="rounded-3xl border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">R {stats.expenses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-destructive">
              <TrendingDown className="h-3 w-3" /> Household Spending
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Savings Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">R 25,000.00</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Family Holiday Goal</p>
          </CardContent>
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
                <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : transactions?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No transactions logged yet.</TableCell></TableRow>
              ) : (
                transactions?.map((tx) => (
                  <TableRow key={tx.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium text-muted-foreground">
                      {tx.date ? format(new Date(tx.date.seconds * 1000), "MMM dd, yyyy") : "Pending..."}
                    </TableCell>
                    <TableCell className="font-bold">{tx.description || "No description"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold text-[10px] uppercase bg-muted text-muted-foreground border-none px-2">
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${tx.type === 'income' || tx.type === 'allowance' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {tx.type === 'income' || tx.type === 'allowance' ? '+' : '-'} R {Math.abs(tx.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
