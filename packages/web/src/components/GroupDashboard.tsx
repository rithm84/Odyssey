"use client";
import { ListTodo, Package, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow-red border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
            <ListTodo className="h-5 w-5 text-white" />
          </div>
          <span>Group Dashboard</span>
        </h2>

        <Tabs defaultValue="packing" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="packing" className="rounded-lg font-bold data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-medium">
              <Package className="h-4 w-4 mr-2" />
              Shared Packing
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg font-bold data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-medium">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Group Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packing" className="space-y-3 mt-6">
            <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-foreground">
                  {Object.values(packingChecked).filter(Boolean).length} of {packingItems.length} items packed
                </span>
                <Badge className="gradient-primary text-white border-0 font-bold px-3 py-1 shadow-medium">
                  {Math.round(packingProgress)}%
                </Badge>
              </div>
              <Progress value={packingProgress} className="h-3" />
            </div>

            {packingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-primary/20 group/item"
              >
                <Checkbox
                  checked={packingChecked[item.id]}
                  onCheckedChange={(checked) =>
                    setPackingChecked({ ...packingChecked, [item.id]: !!checked })
                  }
                  className="h-5 w-5"
                />
                <span className={`flex-1 font-medium text-base ${packingChecked[item.id] ? "line-through text-muted-foreground" : "group-hover/item:text-primary transition-colors"}`}>
                  {item.item}
                </span>
                <Avatar className="h-9 w-9 gradient-primary text-white shadow-medium">
                  <AvatarFallback className="gradient-primary font-bold text-sm">{item.assignee}</AvatarFallback>
                </Avatar>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-3 mt-6">
            <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-foreground">
                  {Object.values(tasksChecked).filter(Boolean).length} of {tasks.length} tasks completed
                </span>
                <Badge className="gradient-primary text-white border-0 font-bold px-3 py-1 shadow-medium">
                  {Math.round(tasksProgress)}%
                </Badge>
              </div>
              <Progress value={tasksProgress} className="h-3" />
            </div>

            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-primary/20 group/item"
              >
                <Checkbox
                  checked={tasksChecked[task.id]}
                  onCheckedChange={(checked) =>
                    setTasksChecked({ ...tasksChecked, [task.id]: !!checked })
                  }
                  className="h-5 w-5"
                />
                <span className={`flex-1 font-medium text-base ${tasksChecked[task.id] ? "line-through text-muted-foreground" : "group-hover/item:text-primary transition-colors"}`}>
                  {task.task}
                </span>
                <Avatar className="h-9 w-9 gradient-warm text-white shadow-medium">
                  <AvatarFallback className="gradient-warm font-bold text-sm">{task.assignee}</AvatarFallback>
                </Avatar>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
