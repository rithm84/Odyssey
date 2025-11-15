"use client";
import { ListTodo } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useState, useMemo } from "react";

const packingItems = [
  { id: 1, item: "Camping tents (2)", assignee: "SJ", checked: true },
  { id: 2, item: "Sleeping bags", assignee: "MC", checked: true },
  { id: 3, item: "Cooking equipment", assignee: "ED", checked: false },
  { id: 4, item: "First aid kit", assignee: "JW", checked: false },
  { id: 5, item: "Flashlights & batteries", assignee: "LA", checked: true },
];

const tasks = [
  { id: 1, task: "Reserve campsite", assignee: "SJ", checked: true },
  { id: 2, task: "Plan meal menu", assignee: "MC", checked: true },
  { id: 3, task: "Buy groceries", assignee: "ED", checked: false },
  { id: 4, task: "Check weather updates", assignee: "JW", checked: false },
  { id: 5, task: "Create playlist", assignee: "TM", checked: false },
];

export function GroupDashboard() {
  const [packingChecked, setPackingChecked] = useState<Record<number, boolean>>(
    Object.fromEntries(packingItems.map(item => [item.id, item.checked]))
  );
  const [tasksChecked, setTasksChecked] = useState<Record<number, boolean>>(
    Object.fromEntries(tasks.map(task => [task.id, task.checked]))
  );

  const packingProgress = useMemo(() => {
    const total = packingItems.length;
    const completed = Object.values(packingChecked).filter(Boolean).length;
    return (completed / total) * 100;
  }, [packingChecked]);

  const tasksProgress = useMemo(() => {
    const total = tasks.length;
    const completed = Object.values(tasksChecked).filter(Boolean).length;
    return (completed / total) * 100;
  }, [tasksChecked]);

  return (
    <Card className="p-6 shadow-soft transition-smooth hover:shadow-medium">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ListTodo className="h-6 w-6 text-primary" />
        Group Dashboard
      </h2>
      <Tabs defaultValue="packing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packing">Shared Packing List</TabsTrigger>
          <TabsTrigger value="tasks">Group Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="packing" className="space-y-3 mt-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {Object.values(packingChecked).filter(Boolean).length} of {packingItems.length} items packed
              </span>
              <span className="text-sm font-semibold text-primary">{Math.round(packingProgress)}%</span>
            </div>
            <Progress value={packingProgress} />
          </div>
          {packingItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
            >
              <Checkbox
                checked={packingChecked[item.id]}
                onCheckedChange={(checked) =>
                  setPackingChecked({ ...packingChecked, [item.id]: !!checked })
                }
              />
              <span className={`flex-1 ${packingChecked[item.id] ? "line-through text-muted-foreground" : ""}`}>
                {item.item}
              </span>
              <Avatar className="h-8 w-8 bg-primary text-white text-xs">
                <AvatarFallback className="bg-primary text-xs">{item.assignee}</AvatarFallback>
              </Avatar>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="tasks" className="space-y-3 mt-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {Object.values(tasksChecked).filter(Boolean).length} of {tasks.length} tasks completed
              </span>
              <span className="text-sm font-semibold text-primary">{Math.round(tasksProgress)}%</span>
            </div>
            <Progress value={tasksProgress} />
          </div>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
            >
              <Checkbox
                checked={tasksChecked[task.id]}
                onCheckedChange={(checked) =>
                  setTasksChecked({ ...tasksChecked, [task.id]: !!checked })
                }
              />
              <span className={`flex-1 ${tasksChecked[task.id] ? "line-through text-muted-foreground" : ""}`}>
                {task.task}
              </span>
              <Avatar className="h-8 w-8 bg-secondary text-white text-xs">
                <AvatarFallback className="bg-secondary text-xs">{task.assignee}</AvatarFallback>
              </Avatar>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  );
}