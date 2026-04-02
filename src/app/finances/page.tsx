"use client"

import * as React from "react"
import { Wallet, TrendingUp, TrendingDown, Plus, Download, Filter, Landmark } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function FinancesPage() {
  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Finances & Allowances</h1>
          <p className="text-muted-foreground font-medium">Tracking the Kapendeka Family wealth in ZAR</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button className="rounded-xl h-11 px-6 font-bold bg-accent shadow-lg shadow-accent/20">
            <Plus className="h-4 w-4 mr-2" /> Add Transaction
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R 12,450.00</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium bg-white/10 w-fit px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" /> +2.5% this month
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">R 4,820.00</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-destructive">
              <TrendingDown className="h-3 w-3" /> -R 200 from budget
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Savings Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">R 25,000.00</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Family Holiday: 50% complete</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
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
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Description</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Member</TableHead>
                <TableHead className="text-right font-bold">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { date: "Apr 08, 2026", desc: "Woolworths Grocery", cat: "Food", user: "George", amount: -850.50, type: "expense" },
                { date: "Apr 07, 2026", desc: "Monthly Allowance", cat: "Income", user: "Junior", amount: 500.00, type: "income" },
                { date: "Apr 06, 2026", desc: "Shell Fuel", cat: "Travel", user: "George", amount: -1200.00, type: "expense" },
                { date: "Apr 05, 2026", desc: "Checkers Hyper", cat: "Household", user: "George", amount: -450.25, type: "expense" }
              ].map((tx, i) => (
                <TableRow key={i} className="group transition-colors">
                  <TableCell className="font-medium text-muted-foreground">{tx.date}</TableCell>
                  <TableCell className="font-bold">{tx.desc}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-bold text-[10px] uppercase bg-muted text-muted-foreground border-none px-2">{tx.cat}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tx.user}</TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                    {tx.type === 'income' ? '+' : ''} R {Math.abs(tx.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}