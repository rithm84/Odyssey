// Odyssey V2 - Database TypeScript Types

// =====
// ENUMS
// =====
 
export type EventType = 'social' | 'trip' | 'meeting' | 'sports' | 'food' | 'gaming' | 'other';

export type CreationMethod = 'nlp' | 'slash_command';

export type EventRole = 'organizer' | 'co_host' | 'member' | 'viewer';

export type RsvpStatus = 'yes' | 'no' | 'maybe';

export type PollType = 'embed' | 'web';

export type VoteType = 'single_choice' | 'multiple_choice' | 'availability_grid';

export type TransportationRole = 'driver' | 'rider';

export type ReminderType = 'event' | 'packing' | 'poll' | 'weather' | 'custom';

export type DeliveryMethod = 'dm' | 'channel';

export type SplitType = 'equal' | 'custom' | 'percentage';

export type Priority = 'low' | 'medium' | 'high';

// ===========
// JSONB TYPES
// ===========

export interface EnabledModules {

    schedule: boolean;

    attendees: boolean;

    group_packing: boolean;

    individual_packing: boolean;

    transportation: boolean;

    weather: boolean;

    photos: boolean;

}

export interface PollOption {

    id: string;

    label: string;

    votes?: number;

}

export interface TimeSlot {

    id: string;

    time: string;

    label?: string;

}

export interface AvailabilityResponse {

    [dateTime: string]: 'available' | 'maybe' | 'unavailable';

}

export interface SplitDetails {

    [userId: string]: number; // amount per user

}

export interface ActionItem {

    description: string;

    assignedTo?: string; // Discord user ID

    completed?: boolean;

}

// ================
// CORE TABLE TYPES
// ================

export interface User {

    id: string; // UUID

    discord_id: string;

    username: string;

    avatar_url?: string;

    email?: string;

    created_at: string; // ISO timestamp

    updated_at: string;

}

export interface Event {

    id: string; // UUID

    name: string;

    description?: string;

    date?: string;

    time?: string;

    location?: string;

    // V2 Fields

    guild_id: string;

    guild_name?: string;

    event_type: EventType;

    enabled_modules: EnabledModules;

    creation_method: CreationMethod;

    // Discord Integration

    discord_event_id?: string;

    synced_with_discord: boolean;

    // Metadata

    created_by: string; // Discord user ID

    channel_id: string;

    created_at: string;

    updated_at: string;

}

export interface EventMember {

    id: string; // UUID

    event_id: string;

    user_id: string; // Discord user ID

    role: EventRole;

    rsvp_status?: RsvpStatus;

    joined_at: string;

    updated_at: string;

}

export interface ScheduleItem {

    id: string; // UUID

    event_id: string;

    title: string;

    description?: string;

    start_time?: string;

    end_time?: string;

    order_index: number;

    created_by: string;

    created_at: string;

    updated_at: string;

}

// ==============
// POLLS & VOTING
// ==============

export interface Poll {

    id: string; // UUID

    event_id?: string;

    guild_id: string;

    channel_id: string;

    message_id?: string;

    title: string;

    description?: string;

    poll_type: PollType;

    vote_type: VoteType;

    // Options

    options?: PollOption[];

    date_options?: string[]; // Array of date strings

    time_slots?: TimeSlot[];

    // Settings

    is_anonymous: boolean;

    allow_maybe: boolean;

    deadline?: string;

    // AI Features

    creation_method: 'manual' | 'ai';

    ai_prompt?: string;

    // Metadata

    created_by: string;

    created_at: string;

    updated_at: string;

    closed_at?: string;

}

export interface PollResponse {

    id: string; // UUID

    poll_id: string;

    user_id: string;

    // For simple polls

    selected_option_ids?: string[];

    // For availability grid polls

    availability?: AvailabilityResponse;

    // Anonymous mode

    has_voted: boolean;

    created_at: string;

    updated_at: string;

}

// =============
// PACKING LISTS
// =============

export interface PackingItem {

    id: string; // UUID

    event_id: string;

    item_name: string;

    quantity: number;

    assigned_to?: string; // Discord user ID

    is_packed: boolean;

    pending_approval: boolean;

    added_by: string;

    created_at: string;

    updated_at: string;

}

export interface IndividualPackingItem {

    id: string; // UUID

    event_id: string;

    user_id: string;

    item_name: string;

    quantity: number;

    is_packed: boolean;

    created_at: string;

    updated_at: string;

}

// =====
// TASKS
// =====

export interface Task {

    id: string; // UUID

    event_id: string;

    task_description: string;

    assigned_to?: string; // Discord user ID

    is_complete: boolean;

    due_date?: string; // Date string

    priority: Priority;

    created_by: string;

    created_at: string;

    updated_at: string;

    completed_at?: string;

}

// ==============
// TRANSPORTATION
// ==============

export interface Transportation {

    id: string; // UUID

    event_id: string;

    user_id: string;

    role: TransportationRole;

    // Driver-specific

    seats_available?: number;

    seats_taken?: number;

    vehicle_description?: string;

    // Both

    pickup_location?: string;

    pickup_time?: string; // Time string

    notes?: string;

    // Rider assignment

    assigned_driver_id?: string;

    created_at: string;

    updated_at: string;

}

// =========
// REMINDERS
// =========

export interface Reminder {

    id: string; // UUID

    event_id?: string;

    poll_id?: string;

    reminder_type: ReminderType;

    message: string;

    scheduled_time: string;

    sent: boolean;

    sent_at?: string;

    recipients: string[]; // Array of Discord user IDs

    delivery_method: DeliveryMethod;

    channel_id?: string;

    created_at: string;

}

// =================
// BUDGET & EXPENSES
// =================

export interface Expense {

    id: string; // UUID

    event_id: string;

    description: string;

    amount: number; // Decimal as number

    currency: string;

    paid_by: string; // Discord user ID

    split_type: SplitType;

    split_details?: SplitDetails;

    created_at: string;

    updated_at: string;

}

// ========
// AI & RAG
// ========

export interface MessageEmbedding {

    id: string; // UUID

    event_id?: string;

    guild_id: string;

    channel_id: string;

    message_id: string;

    user_id: string;

    content: string;

    embedding: number[]; // Vector array

    created_at: string;

}

export interface EventSummary {

    id: string; // UUID

    event_id: string;

    summary: string;

    action_items?: ActionItem[];

    generated_at: string;

    generated_by: 'ai' | 'manual';

}

// ======================================
// INSERT TYPES (for creating new records)
// ======================================

export type InsertEvent = Omit<Event, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

export type InsertEventMember = Omit<EventMember, 'id' | 'joined_at' | 'updated_at'> & {

    id?: string;

    joined_at?: string;

    updated_at?: string;

};

export type InsertScheduleItem = Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

export type InsertPoll = Omit<Poll, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

export type InsertPollResponse = Omit<PollResponse, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

export type InsertPackingItem = Omit<PackingItem, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

export type InsertIndividualPackingItem = Omit<IndividualPackingItem, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

export type InsertTask = Omit<Task, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

export type InsertTransportation = Omit<Transportation, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

export type InsertReminder = Omit<Reminder, 'id' | 'created_at'> & {

    id?: string;

    created_at?: string;

};

export type InsertExpense = Omit<Expense, 'id' | 'created_at' | 'updated_at'> & {

    id?: string;

    created_at?: string;

    updated_at?: string;

};

// =========================================================
// UPDATE TYPES (for updating records - all fields optional)
// =========================================================

export type UpdateEvent = Partial<Omit<Event, 'id' | 'created_at' | 'created_by'>>;

export type UpdateEventMember = Partial<Omit<EventMember, 'id' | 'event_id' | 'user_id' | 'joined_at'>>;

export type UpdateScheduleItem = Partial<Omit<ScheduleItem, 'id' | 'event_id' | 'created_at' | 'created_by'>>;

export type UpdatePoll = Partial<Omit<Poll, 'id' | 'created_at' | 'created_by'>>;

export type UpdatePollResponse = Partial<Omit<PollResponse, 'id' | 'poll_id' | 'user_id' | 'created_at'>>;

export type UpdatePackingItem = Partial<Omit<PackingItem, 'id' | 'event_id' | 'created_at' | 'added_by'>>;

export type UpdateIndividualPackingItem = Partial<Omit<IndividualPackingItem, 'id' | 'event_id' | 'user_id' | 'created_at'>>;

export type UpdateTask = Partial<Omit<Task, 'id' | 'event_id' | 'created_at' | 'created_by'>>;

export type UpdateTransportation = Partial<Omit<Transportation, 'id' | 'event_id' | 'user_id' | 'created_at'>>;

export type UpdateExpense = Partial<Omit<Expense, 'id' | 'event_id' | 'created_at' | 'paid_by'>>;

// ===================================
// DATABASE TYPE (for Supabase client)
// ===================================

export interface Database {

    public: {

        Tables: {

            users: {

                Row: User;

                Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;

                Update: Partial<Omit<User, 'id' | 'discord_id' | 'created_at'>>;

            };

            events: {

                Row: Event;

                Insert: InsertEvent;

                Update: UpdateEvent;

            };

            event_members: {

                Row: EventMember;

                Insert: InsertEventMember;

                Update: UpdateEventMember;

            };

            schedule_items: {

                Row: ScheduleItem;

                Insert: InsertScheduleItem;

                Update: UpdateScheduleItem;

            };

            polls: {

                Row: Poll;

                Insert: InsertPoll;

                Update: UpdatePoll;

            };

            poll_responses: {

                Row: PollResponse;

                Insert: InsertPollResponse;

                Update: UpdatePollResponse;

            };

            packing_items: {

                Row: PackingItem;

                Insert: InsertPackingItem;

                Update: UpdatePackingItem;

            };

            individual_packing_items: {

                Row: IndividualPackingItem;

                Insert: InsertIndividualPackingItem;

                Update: UpdateIndividualPackingItem;

            };

            tasks: {

                Row: Task;

                Insert: InsertTask;

                Update: UpdateTask;

            };

            transportation: {

                Row: Transportation;

                Insert: InsertTransportation;

                Update: UpdateTransportation;

            };

            reminders: {

                Row: Reminder;

                Insert: InsertReminder;

                Update: Partial<Omit<Reminder, 'id' | 'created_at'>>;

            };

            expenses: {

                Row: Expense;

                Insert: InsertExpense;

                Update: UpdateExpense;

            };

            message_embeddings: {

                Row: MessageEmbedding;

                Insert: Omit<MessageEmbedding, 'id' | 'created_at'>;

                Update: Partial<Omit<MessageEmbedding, 'id' | 'message_id' | 'created_at'>>;

            };

            event_summaries: {

                Row: EventSummary;

                Insert: Omit<EventSummary, 'id' | 'generated_at'>;

                Update: Partial<Omit<EventSummary, 'id' | 'event_id' | 'generated_at'>>;

            };

        };

    };

}