"use client";
import { useState, useMemo } from "react";
import { ListTodo, Package, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePackingItems } from "@/hooks/usePackingItems";
import { useTasks } from "@/hooks/useTasks";
import { useEventMembers } from "@/hooks/useEventMembers";

interface GroupDashboardProps {
  eventId: string;
}

export function GroupDashboard({ eventId }: GroupDashboardProps) {
  const { packingItems, loading: packingLoading, userRole: packingUserRole, canAddTasks: canEditPacking, addItem: addPackingItem, updateItem: updatePackingItem, deleteItem: deletePackingItem } = usePackingItems(eventId);
  const { tasks, loading: tasksLoading, canAddTasks, addTask, updateTask, deleteTask } = useTasks(eventId);
  const { members, loading: membersLoading } = useEventMembers(eventId);

  // Members, co-hosts, and organizers can add packing items (members with pending approval)
  // Viewers cannot add packing items
  const canAddPackingItems = packingUserRole && packingUserRole !== 'viewer';

  // Packing item dialog state
  const [isPackingDialogOpen, setIsPackingDialogOpen] = useState(false);
  const [editingPackingItem, setEditingPackingItem] = useState<string | null>(null);
  const [packingFormData, setPackingFormData] = useState<{
    item_name: string;
    quantity: number | string;
    assigned_to: string;
  }>({
    item_name: "",
    quantity: 1,
    assigned_to: "unassigned",
  });
  const [isPackingSubmitting, setIsPackingSubmitting] = useState(false);

  // Task dialog state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    task_description: "",
    assigned_to: "unassigned",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
  });
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  const packingProgress = useMemo(() => {
    if (packingItems.length === 0) return 0;
    const completed = packingItems.filter((item) => item.is_packed).length;
    return (completed / packingItems.length) * 100;
  }, [packingItems]);

  const tasksProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((task) => task.is_complete).length;
    return (completed / tasks.length) * 100;
  }, [tasks]);

  // Helper to get user display data
  const getUserData = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return {
      username: member?.username || userId,
      avatarUrl: member?.avatar_url,
      initials: member?.username?.substring(0, 2).toUpperCase() || userId.substring(0, 2).toUpperCase(),
    };
  };

  // Packing item handlers
  const handleOpenPackingDialog = (itemId?: string) => {
    if (itemId) {
      const item = packingItems.find((i) => i.id === itemId);
      if (item) {
        setEditingPackingItem(itemId);
        setPackingFormData({
          item_name: item.item_name,
          quantity: item.quantity,
          assigned_to: item.assigned_to || "unassigned",
        });
      }
    } else {
      setEditingPackingItem(null);
      setPackingFormData({
        item_name: "",
        quantity: 1,
        assigned_to: "unassigned",
      });
    }
    setIsPackingDialogOpen(true);
  };

  const handleAddOrUpdatePackingItem = async () => {
    if (!packingFormData.item_name.trim()) return;

    setIsPackingSubmitting(true);
    try {
      const assigned = packingFormData.assigned_to === "unassigned" ? null : packingFormData.assigned_to;
      const quantity = typeof packingFormData.quantity === "string"
        ? parseInt(packingFormData.quantity) || 1
        : packingFormData.quantity || 1;

      if (editingPackingItem) {
        await updatePackingItem(editingPackingItem, {
          item_name: packingFormData.item_name,
          quantity,
          assigned_to: assigned || null,
        });
      } else {
        await addPackingItem({
          item_name: packingFormData.item_name,
          quantity,
          assigned_to: assigned,
        });
      }
      setIsPackingDialogOpen(false);
      setEditingPackingItem(null);
      setPackingFormData({ item_name: "", quantity: 1, assigned_to: "unassigned" });
    } catch (error) {
      console.error("Error saving packing item:", error);
    } finally {
      setIsPackingSubmitting(false);
    }
  };

  const handleDeletePackingItem = async (itemId: string) => {
    setIsPackingSubmitting(true);
    try {
      await deletePackingItem(itemId);
      setIsPackingDialogOpen(false);
      setEditingPackingItem(null);
    } catch (error) {
      console.error("Error deleting packing item:", error);
    } finally {
      setIsPackingSubmitting(false);
    }
  };

  const handleApprovePackingItem = async (itemId: string) => {
    setIsPackingSubmitting(true);
    try {
      await updatePackingItem(itemId, { pending_approval: false });
      setIsPackingDialogOpen(false);
      setEditingPackingItem(null);
    } catch (error) {
      console.error("Error approving packing item:", error);
    } finally {
      setIsPackingSubmitting(false);
    }
  };

  const handleTogglePacked = async (itemId: string, currentState: boolean) => {
    try {
      await updatePackingItem(itemId, { is_packed: !currentState });
    } catch (error) {
      console.error("Error toggling packed state:", error);
    }
  };

  // Task handlers
  const handleOpenTaskDialog = (taskId?: string) => {
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setEditingTask(taskId);
        setTaskFormData({
          task_description: task.task_description,
          assigned_to: task.assigned_to || "unassigned",
          due_date: task.due_date || "",
          priority: task.priority,
        });
      }
    } else {
      setEditingTask(null);
      setTaskFormData({
        task_description: "",
        assigned_to: "unassigned",
        due_date: "",
        priority: "medium",
      });
    }
    setIsTaskDialogOpen(true);
  };

  const handleAddOrUpdateTask = async () => {
    if (!taskFormData.task_description.trim()) return;

    setIsTaskSubmitting(true);
    try {
      const assigned = taskFormData.assigned_to === "unassigned" ? null : taskFormData.assigned_to;
      if (editingTask) {
        await updateTask(editingTask, {
          task_description: taskFormData.task_description,
          assigned_to: assigned || null,
          due_date: taskFormData.due_date || null,
          priority: taskFormData.priority,
        });
      } else {
        await addTask({
          task_description: taskFormData.task_description,
          assigned_to: assigned,
          due_date: taskFormData.due_date || undefined,
          priority: taskFormData.priority,
        });
      }
      setIsTaskDialogOpen(false);
      setEditingTask(null);
      setTaskFormData({ task_description: "", assigned_to: "unassigned", due_date: "", priority: "medium" });
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setIsTaskSubmitting(true);
    try {
      await deleteTask(taskId);
      setIsTaskDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handleToggleComplete = async (taskId: string, currentState: boolean) => {
    try {
      await updateTask(taskId, { is_complete: !currentState });
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  // Format due date
  const formatDueDate = (dueDateStr: string) => {
    // Force noon interpretation to avoid timezone issues (see ERROR_LOG.md Bug #1)
    const dueDate = new Date(dueDateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const isOverdue = dueDate < today;
    const formattedDate = dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return { formattedDate, isOverdue };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
      case "medium":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "low":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  const currentEditingPackingItem = editingPackingItem ? packingItems.find((i) => i.id === editingPackingItem) : null;

  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-primary flex items-center justify-center border-2 border-black dark:border-white">
            <ListTodo className="h-5 w-5 text-white dark:text-black" />
          </div>
          <span>Group Dashboard</span>
        </h2>

        <Tabs defaultValue="packing" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
            <TabsTrigger value="packing" className="font-bold data-[state=active]:!bg-primary data-[state=active]:text-white dark:data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black dark:data-[state=active]:border-white">
              <Package className="h-4 w-4 mr-2" />
              Shared Packing
            </TabsTrigger>
            <TabsTrigger value="tasks" className="font-bold data-[state=active]:!bg-primary data-[state=active]:text-white dark:data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black dark:data-[state=active]:border-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Group Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packing" className="space-y-3 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-foreground">
                    {packingItems.filter((i) => i.is_packed).length} of {packingItems.length} items packed
                  </span>
                  <Badge className="gradient-primary text-white border-0 font-bold px-3 py-1 shadow-medium">
                    {Math.round(packingProgress)}%
                  </Badge>
                </div>
                <Progress value={packingProgress} className="h-3" />
              </div>
              {canAddPackingItems && (
                <Button
                  size="icon"
                  className="h-[4.5rem] w-12 rounded-xl ml-0 gradient-primary text-white shadow-medium hover:shadow-glow"
                  onClick={() => handleOpenPackingDialog()}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}
            </div>

            {packingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : packingItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{canAddPackingItems ? "No packing items yet. Add your first item!" : "No packing items yet."}</p>
              </div>
            ) : (
              packingItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 py-2 px-4 rounded-xl transition-all border border-transparent ${canAddPackingItems ? 'hover:bg-muted/50 hover:border-primary/20 cursor-pointer' : ''}`}
                  onClick={() => canAddPackingItems && handleOpenPackingDialog(item.id)}
                >
                  <Checkbox
                    checked={item.is_packed}
                    onCheckedChange={() => handleTogglePacked(item.id, item.is_packed)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5"
                  />
                  <span className={`flex-1 font-medium text-base ${item.is_packed ? "line-through text-muted-foreground" : "group-hover/item:text-primary transition-colors"}`}>
                    {item.item_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge className="gradient-primary text-white border-0 font-bold px-2 py-0.5 text-xs">
                      {item.quantity}x
                    </Badge>
                    {item.pending_approval && (
                      <Badge className="gradient-primary text-white border-0 font-bold px-2 py-0.5 text-xs">
                        Pending
                      </Badge>
                    )}
                    {item.assigned_to && (() => {
                      const userData = getUserData(item.assigned_to);
                      return (
                        <Avatar className="h-9 w-9 gradient-primary text-white shadow-medium">
                          {userData.avatarUrl && <AvatarImage src={userData.avatarUrl} alt={userData.username} />}
                          <AvatarFallback className="gradient-primary font-bold text-sm">{userData.initials}</AvatarFallback>
                        </Avatar>
                      );
                    })()}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-3 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-foreground">
                    {tasks.filter((t) => t.is_complete).length} of {tasks.length} tasks completed
                  </span>
                  <Badge className="gradient-primary text-white border-0 font-bold px-3 py-1 shadow-medium">
                    {Math.round(tasksProgress)}%
                  </Badge>
                </div>
                <Progress value={tasksProgress} className="h-3" />
              </div>
              {canAddTasks && (
                <Button
                  size="icon"
                  className="h-[4.5rem] w-12 rounded-xl ml-0 gradient-primary text-white shadow-medium hover:shadow-glow"
                  onClick={() => handleOpenTaskDialog()}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}
            </div>

            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{canAddTasks ? "No tasks yet. Add your first task!" : "No tasks yet."}</p>
              </div>
            ) : (
              tasks.map((task) => {
                const dueDateInfo = task.due_date ? formatDueDate(task.due_date) : null;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 py-2 px-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-primary/20 group/item cursor-pointer"
                    onClick={() => canAddTasks && handleOpenTaskDialog(task.id)}
                  >
                    <Checkbox
                      checked={task.is_complete}
                      onCheckedChange={() => handleToggleComplete(task.id, task.is_complete)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5"
                    />
                    <span className={`flex-1 font-medium text-base ${task.is_complete ? "line-through text-muted-foreground" : "group-hover/item:text-primary transition-colors"}`}>
                      {task.task_description}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(task.priority)} border-0 font-bold px-2 py-0.5 text-xs capitalize`}>
                        {task.priority}
                      </Badge>
                      {dueDateInfo && (
                        <Badge className={`${dueDateInfo.isOverdue ? "bg-red-500/20 text-red-700 dark:text-red-300" : "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300"} border-0 font-bold px-2 py-0.5 text-xs`}>
                          {dueDateInfo.formattedDate}
                        </Badge>
                      )}
                      {task.assigned_to && (() => {
                        const userData = getUserData(task.assigned_to);
                        return (
                          <Avatar className="h-9 w-9 gradient-neon text-white shadow-medium">
                            {userData.avatarUrl && <AvatarImage src={userData.avatarUrl} alt={userData.username} />}
                            <AvatarFallback className="gradient-neon font-bold text-sm">{userData.initials}</AvatarFallback>
                          </Avatar>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Packing Item Dialog */}
      <Dialog open={isPackingDialogOpen} onOpenChange={setIsPackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPackingItem ? "Edit Packing Item" : "Add Packing Item"}</DialogTitle>
            <DialogDescription>
              {editingPackingItem ? "Update the packing item details" : "Add a new item to the shared packing list"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Item Name <span className="text-destructive">*</span></label>
              <Input
                placeholder="e.g., Camping tent"
                value={packingFormData.item_name}
                onChange={(e) => setPackingFormData({ ...packingFormData, item_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity <span className="text-destructive">*</span></label>
              <Input
                type="number"
                min="1"
                value={packingFormData.quantity}
                onChange={(e) => setPackingFormData({ ...packingFormData, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Assign To</label>
              <Select
                value={packingFormData.assigned_to}
                onValueChange={(value) => setPackingFormData({ ...packingFormData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      Unassigned
                    </div>
                  </SelectItem>
                  {members.map((member) => {
                    const userData = getUserData(member.user_id);
                    return (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 gradient-primary text-white">
                            {userData.avatarUrl && <AvatarImage src={userData.avatarUrl} alt={userData.username} />}
                            <AvatarFallback className="gradient-primary font-bold text-xs">{userData.initials}</AvatarFallback>
                          </Avatar>
                          <span>{userData.username}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingPackingItem && (
              <>
                {canEditPacking && currentEditingPackingItem?.pending_approval && (
                  <div className="flex gap-2 mr-auto">
                    <Button
                      variant="destructive"
                      onClick={() => handleDeletePackingItem(editingPackingItem)}
                      disabled={isPackingSubmitting}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprovePackingItem(editingPackingItem)}
                      disabled={isPackingSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isPackingSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
                    </Button>
                  </div>
                )}
                {!currentEditingPackingItem?.pending_approval && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeletePackingItem(editingPackingItem)}
                    disabled={isPackingSubmitting}
                    className="mr-auto"
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setIsPackingDialogOpen(false)}
              disabled={isPackingSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddOrUpdatePackingItem}
              disabled={!packingFormData.item_name.trim() || !packingFormData.quantity || isPackingSubmitting}
              className="gradient-primary text-white"
            >
              {isPackingSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingPackingItem ? (
                "Save"
              ) : (
                "Add Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the task details" : "Add a new task to the group"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Task Description <span className="text-destructive">*</span></label>
              <Input
                placeholder="e.g., Reserve campsite"
                value={taskFormData.task_description}
                onChange={(e) => setTaskFormData({ ...taskFormData, task_description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Assign To</label>
              <Select
                value={taskFormData.assigned_to}
                onValueChange={(value) => setTaskFormData({ ...taskFormData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      Unassigned
                    </div>
                  </SelectItem>
                  {members.map((member) => {
                    const userData = getUserData(member.user_id);
                    return (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 gradient-neon text-white">
                            {userData.avatarUrl && <AvatarImage src={userData.avatarUrl} alt={userData.username} />}
                            <AvatarFallback className="gradient-neon font-bold text-xs">{userData.initials}</AvatarFallback>
                          </Avatar>
                          <span>{userData.username}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              <Input
                type="date"
                value={taskFormData.due_date}
                onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select
                value={taskFormData.priority}
                onValueChange={(value: "low" | "medium" | "high") => setTaskFormData({ ...taskFormData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🔵 Medium</SelectItem>
                  <SelectItem value="high">🟣 High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingTask && (
              <Button
                variant="destructive"
                onClick={() => handleDeleteTask(editingTask)}
                disabled={isTaskSubmitting}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsTaskDialogOpen(false)}
              disabled={isTaskSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddOrUpdateTask}
              disabled={!taskFormData.task_description.trim() || isTaskSubmitting}
              className="gradient-primary text-white"
            >
              {isTaskSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingTask ? (
                "Save"
              ) : (
                "Add Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
