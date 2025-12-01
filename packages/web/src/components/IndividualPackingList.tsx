"use client";
import { Backpack, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

const personalItems = [
  { id: 1, item: "Hiking boots", checked: true },
  { id: 2, item: "Warm jacket", checked: true },
  { id: 3, item: "Water bottle", checked: false },
  { id: 4, item: "Sunscreen & bug spray", checked: false },
  { id: 5, item: "Personal toiletries", checked: false },
  { id: 6, item: "Prescription medications", checked: true },
  { id: 7, item: "Camera", checked: false },
  { id: 8, item: "Portable charger", checked: false },
];

export function IndividualPackingList() {
  const [checked, setChecked] = useState<Record<number, boolean>>(
    Object.fromEntries(personalItems.map(item => [item.id, item.checked]))
  );

  const completedCount = Object.values(checked).filter(Boolean).length;
  const progress = (completedCount / personalItems.length) * 100;

  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow-red border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
              <Backpack className="h-5 w-5 text-white" />
            </div>
            <span>My Packing List</span>
          </h2>
          <Badge className="gradient-primary text-white border-0 px-4 py-2 text-sm font-bold shadow-medium">
            <Package className="h-4 w-4 mr-1.5" />
            {completedCount}/{personalItems.length}
          </Badge>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
          <div className="flex justify-between mb-3">
            <span className="text-sm font-bold text-foreground">
              {completedCount} of {personalItems.length} items packed
            </span>
            <span className="text-sm font-black gradient-primary px-3 py-1 rounded-lg text-white shadow-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="space-y-3">
          {personalItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-primary/20 group/item"
            >
              <Checkbox
                checked={checked[item.id]}
                onCheckedChange={(checkedState) =>
                  setChecked({ ...checked, [item.id]: !!checkedState })
                }
                className="h-5 w-5"
              />
              <span className={`flex-1 font-medium text-base dark:text-dark-base ${checked[item.id] ? "line-through text-muted-foreground" : "group-hover/item:text-primary transition-colors"}`}>
                {item.item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
