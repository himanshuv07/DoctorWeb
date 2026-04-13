"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" 

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the services page.</p>
        </CardContent>
      </Card>
    </div>
  );
}