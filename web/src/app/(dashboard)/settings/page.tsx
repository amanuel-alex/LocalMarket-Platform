"use client";

import { motion } from "framer-motion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Workspace preferences</p>
      </div>
      <Card className="max-w-lg rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>Locale, notifications, and team settings will live here.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the profile menu for sign out. More controls ship with the polish milestone.
        </CardContent>
      </Card>
    </motion.div>
  );
}
