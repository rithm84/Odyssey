"use client";
import { Backpack, Package, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface IndividualPackingItem {
  id: string;
  item_name: string;
  quantity: number;
  is_packed: boolean;
  created_at: string;
}

interface IndividualPackingListProps {
  eventId: string;
}

export function IndividualPackingList({ eventId }: IndividualPackingListProps) {
  const [items, setItems] = useState<IndividualPackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    item_name: string;
    quantity: number | string;
  }>({
    item_name: "",
    quantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, [eventId]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`individual_packing_${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "individual_packing_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [...prev, payload.new as IndividualPackingItem]);
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as IndividualPackingItem) : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, supabase]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/event/${eventId}/my-packing`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.packingItems || []);
      } else {
        console.error("Failed to fetch packing items:", data.error);
      }
    } catch (error) {
      console.error("Error fetching packing items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (itemId?: string) => {
    if (itemId) {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        setEditingItemId(itemId);
        setFormData({
          item_name: item.item_name,
          quantity: item.quantity,
        });
      }
    } else {
      setEditingItemId(null);
      setFormData({
        item_name: "",
        quantity: 1,
      });
    }
    setShowDialog(true);
  };

  const handleSaveItem = async () => {
    if (!formData.item_name.trim()) return;

    const quantity = typeof formData.quantity === "string"
      ? parseInt(formData.quantity) || 1
      : formData.quantity || 1;

    setIsSubmitting(true);
    try {
      if (editingItemId) {
        // Update existing item
        const response = await fetch(`/api/event/${eventId}/my-packing/${editingItemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_name: formData.item_name,
            quantity,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error("Failed to update item:", data.error);
        }
      } else {
        // Create new item
        const response = await fetch(`/api/event/${eventId}/my-packing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_name: formData.item_name,
            quantity,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error("Failed to add item:", data.error);
        }
      }

      setShowDialog(false);
      setEditingItemId(null);
      setFormData({ item_name: "", quantity: 1 });
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePacked = async (itemId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/event/${eventId}/my-packing/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_packed: !currentState }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to toggle item:", data.error);
      }
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/event/${eventId}/my-packing/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDialog(false);
        setEditingItemId(null);
      } else {
        const data = await response.json();
        console.error("Failed to delete item:", data.error);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = items.filter((item) => item.is_packed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  if (loading) {
    return (
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="mb-6">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
              <Backpack className="h-5 w-5 text-white" />
            </div>
            <span>My Packing List</span>
          </h2>

          <div className="flex items-center gap-3">
            <div className="flex-1 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-foreground">
                  {completedCount} of {items.length} items packed
                </span>
                <Badge className="gradient-primary text-white border-0 font-bold px-3 py-1 shadow-medium">
                  {Math.round(progress)}%
                </Badge>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  className="h-[4.5rem] w-12 rounded-xl ml-0 gradient-primary text-white shadow-medium hover:shadow-glow"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItemId ? "Edit Packing Item" : "Add Packing Item"}</DialogTitle>
                  <DialogDescription>
                    {editingItemId ? "Update the packing item details" : "Add a new item to your packing list"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Item Name <span className="text-destructive">*</span></label>
                    <Input
                      placeholder="e.g., Hiking boots"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantity <span className="text-destructive">*</span></label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  {editingItemId && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteItem(editingItemId)}
                      disabled={isSubmitting}
                      className="mr-auto"
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveItem}
                    disabled={!formData.item_name.trim() || !formData.quantity || isSubmitting}
                    className="gradient-primary text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingItemId ? (
                      "Save"
                    ) : (
                      "Add Item"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <Backpack className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">No packing items yet</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Click "Add Item" to start your packing list
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-2 px-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-primary/20 cursor-pointer"
                onClick={() => handleOpenDialog(item.id)}
              >
                <Checkbox
                  checked={item.is_packed}
                  onCheckedChange={() => handleTogglePacked(item.id, item.is_packed)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5"
                />
                <span className={`flex-1 font-medium text-base ${item.is_packed ? "line-through text-muted-foreground" : ""}`}>
                  {item.item_name}
                </span>
                <Badge className="gradient-primary text-white border-0 font-bold px-2 py-0.5 text-xs">
                  {item.quantity}x
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
