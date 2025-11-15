"use client";
import { Backpack } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
    <Card className="p-6 shadow-soft transition-smooth hover:shadow-medium">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Backpack className="h-6 w-6 text-primary" />
        My Packing List
      </h2>
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{completedCount} of {personalItems.length} packed</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-smooth"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="space-y-3">
        {personalItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
          >
            <Checkbox
              checked={checked[item.id]}
              onCheckedChange={(checkedState) =>
                setChecked({ ...checked, [item.id]: !!checkedState })
              }
            />
            <span className={checked[item.id] ? "line-through text-muted-foreground" : ""}>
              {item.item}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}