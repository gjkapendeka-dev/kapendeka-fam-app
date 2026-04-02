"use client"

import * as React from "react"
import { Settings, User, Globe, Bell, Shield, MapPin, Share2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-headline font-bold tracking-tight">Family Settings</h1>
        <p className="text-muted-foreground font-medium">Manage the Kapendeka Universe configurations</p>
      </header>

      <div className="space-y-6">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Regional Settings
            </CardTitle>
            <CardDescription>Localized defaults for the Kapendeka Family Hub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select defaultValue="johannesburg">
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="johannesburg">Africa/Johannesburg (GMT+2)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select defaultValue="zar">
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zar">South African Rand (ZAR)</SelectItem>
                    <SelectItem value="usd">US Dollar (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="space-y-0.5">
                <div className="text-sm font-bold">Public Holidays</div>
                <div className="text-xs text-muted-foreground">South African school terms and holidays integration</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Control who sees what in the family hub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold">Location Sharing</div>
                  <div className="text-xs text-muted-foreground font-medium">Share your live location with family members</div>
                </div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold">Push Notifications</div>
                  <div className="text-xs text-muted-foreground font-medium">Daily summaries and emergency alerts</div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl h-12 px-8 font-bold">Cancel</Button>
          <Button className="rounded-xl h-12 px-8 font-bold bg-primary shadow-lg shadow-primary/20">Save Changes</Button>
        </div>
      </div>
    </div>
  )
}