"use client";
import { Clock, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useScheduleItems } from "@/hooks/useScheduleItems";

interface ScheduleTimelineProps {
  eventId: string;
}

export function ScheduleTimeline({ eventId }: ScheduleTimelineProps) {
  const { scheduleItems, loading, error, canEdit, addItem, updateItem, deleteItem } = useScheduleItems(eventId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; title: string } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper to convert time string to minutes
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Validation function for time conflicts
  const validateTimes = (startTime: string, endTime: string, excludeItemId?: string): string | null => {
    // Only validate if both times are filled
    if (!startTime || !endTime) return null;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Check 1: Start and end time are the same
    if (startMinutes === endMinutes) {
      return "Start time and end time cannot be the same";
    }

    // Check 2: End time before start time
    if (endMinutes < startMinutes) {
      return "End time must be after start time";
    }

    // Check 3: Overlaps with existing items
    for (const item of scheduleItems) {
      // Skip the item being edited
      if (excludeItemId && item.id === excludeItemId) continue;

      if (!item.start_time || !item.end_time) continue;

      const existingStart = timeToMinutes(item.start_time);
      const existingEnd = timeToMinutes(item.end_time);

      // Check for overlap (allowing exact adjacency)
      const hasOverlap = startMinutes < existingEnd && endMinutes > existingStart;
      const isExactlyAdjacent = startMinutes === existingEnd || endMinutes === existingStart;

      if (hasOverlap && !isExactlyAdjacent) {
        const formatTime = (time: string) => {
          const [hours, minutes] = time.split(":").map(Number);
          const period = hours >= 12 ? "PM" : "AM";
          const displayHours = hours % 12 || 12;
          return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
        };

        return `This time slot overlaps with "${item.title}" (${formatTime(item.start_time)} - ${formatTime(item.end_time)})`;
      }
    }

    return null;
  };

  // Real-time validation effect
  useEffect(() => {
    const error = validateTimes(formData.start_time, formData.end_time, editingItem || undefined);
    setValidationError(error);
  }, [formData.start_time, formData.end_time, scheduleItems, editingItem]);

  const handleAddItem = async () => {
    if (!formData.title.trim() || !formData.start_time || !formData.end_time || validationError) return;

    setIsSubmitting(true);
    try {
      await addItem({
        title: formData.title,
        description: formData.description || undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });
      setIsAddDialogOpen(false);
      setFormData({ title: "", description: "", start_time: "", end_time: "" });
    } catch (err) {
      console.error("Failed to add item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!formData.title.trim() || !formData.start_time || !formData.end_time || validationError) return;

    setIsSubmitting(true);
    try {
      await updateItem(itemId, {
        title: formData.title,
        description: formData.description || undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });
      setEditingItem(null);
      setFormData({ title: "", description: "", start_time: "", end_time: "" });
    } catch (err) {
      console.error("Failed to update item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    try {
      await deleteItem(deletingItem.id);
      setDeletingItem(null);
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item.id);
    setFormData({
      title: item.title,
      description: item.description || "",
      start_time: item.start_time || "",
      end_time: item.end_time || "",
    });
  };

  if (loading) {
    return (
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 shadow-soft">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load schedule items</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 bg-primary flex items-center justify-center border-2 border-black dark:border-white flex-shrink-0">
              <Clock className="h-5 w-5 text-white dark:text-black" />
            </div>
            <span className="break-words">Schedule of Events</span>
          </h2>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {canEdit && (
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setValidationError(null);
                  setFormData({ title: "", description: "", start_time: "", end_time: "" });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-white shadow-medium hover:shadow-glow">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Schedule Item</DialogTitle>
                <DialogDescription>
                  Add a new item to the event schedule
                </DialogDescription>
              </DialogHeader>
              <div className={`space-y-4 pt-4 ${validationError ? 'pb-2' : 'pb-4'}`}>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Morning Hike"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Input
                    placeholder="e.g., Trail to Mirror Lake"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Start Time <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      End Time <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                {validationError && (
                  <p className="text-sm text-destructive">
                    {validationError}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setValidationError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddItem}
                  disabled={!formData.title.trim() || !formData.start_time || !formData.end_time || validationError !== null || isSubmitting}
                  className="gradient-primary text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            )}
            <p className="text-muted-foreground font-medium text-sm">
              {scheduleItems.length} {scheduleItems.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {scheduleItems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border/40 rounded-xl">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground font-medium mb-2">No schedule items yet</p>
            <p className="text-sm text-muted-foreground/70">
              {canEdit
                ? "Add your first schedule item to get started"
                : "Schedule items will appear here once added by the event organizer"
              }
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="space-y-6">
              {scheduleItems.map((item, index) => (
                <div key={item.id} className="relative pl-14 group/item">
                  {/* Icon */}
                  <div className="absolute left-0 w-10 h-10 bg-primary flex items-center justify-center border-2 border-black dark:border-white group-hover/item:scale-110 transition-transform duration-300 z-10">
                    <div className="w-4 h-4 rounded-full bg-white dark:bg-black border-2 border-black dark:border-white" />
                  </div>

                  {/* Connector bar to next item (not shown for last item) */}
                  {index !== scheduleItems.length - 1 && (
                    <div className="absolute left-5 top-10 w-1 h-[calc(100%+1.5rem)] bg-primary" />
                  )}

                  <div className="p-4 rounded-xl border border-border/60 hover:border-primary/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-medium group-hover/item:translate-x-2">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 flex-wrap flex-1">
                        {(item.start_time || item.end_time) && (
                          <Badge className="gradient-neon text-white border-0 font-bold px-3 py-1 shadow-medium">
                            {item.start_time && formatTime(item.start_time)}
                            {item.start_time && item.end_time && " - "}
                            {item.end_time && formatTime(item.end_time)}
                          </Badge>
                        )}
                        <h3 className="font-black text-lg dark:text-dark-lg group-hover/item:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Dialog open={editingItem === item.id} onOpenChange={(open) => {
                            if (!open) {
                              setEditingItem(null);
                              setFormData({ title: "", description: "", start_time: "", end_time: "" });
                              setValidationError(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(item)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Schedule Item</DialogTitle>
                              <DialogDescription>
                                Update the schedule item details
                              </DialogDescription>
                            </DialogHeader>
                            <div className={`space-y-4 pt-4 ${validationError ? 'pb-2' : 'pb-4'}`}>
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Title <span className="text-destructive">*</span>
                                </label>
                                <Input
                                  placeholder="e.g., Morning Hike"
                                  value={formData.title}
                                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Description</label>
                                <Input
                                  placeholder="e.g., Trail to Mirror Lake"
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    Start Time <span className="text-destructive">*</span>
                                  </label>
                                  <Input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    End Time <span className="text-destructive">*</span>
                                  </label>
                                  <Input
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    required
                                  />
                                </div>
                              </div>
                              {validationError && (
                                <p className="text-sm text-destructive">
                                  {validationError}
                                </p>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingItem(null);
                                  setFormData({ title: "", description: "", start_time: "", end_time: "" });
                                  setValidationError(null);
                                }}
                                disabled={isSubmitting}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleUpdateItem(item.id)}
                                disabled={!formData.title.trim() || !formData.start_time || !formData.end_time || validationError !== null || isSubmitting}
                                className="gradient-primary text-white"
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save Changes"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingItem({ id: item.id, title: item.title })}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Schedule Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingItem?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteItem}
                className="bg-destructive hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}

// Helper function to format time from 24-hour to 12-hour format
function formatTime(time: string): string {
  if (!time) return "";

  // Handle both HH:MM and HH:MM:SS formats
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}
