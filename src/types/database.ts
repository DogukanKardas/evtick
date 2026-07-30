export type UserRole = "employee" | "support" | "admin" | "super_admin";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Company {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface CompanyWithStats extends Company {
  user_count: number;
  ticket_count: number;
  open_tickets: number;
}

export interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  role: UserRole;
  full_name: string;
  created_at: string;
  company?: Company;
}

export interface PlatformStats {
  total_companies: number;
  active_companies: number;
  total_users: number;
  total_tickets: number;
  open_tickets: number;
}

export interface Ticket {
  id: string;
  company_id: string;
  created_by: string;
  assigned_to: string | null;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  creator?: Profile;
  assignee?: Profile | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface TicketStatusLog {
  id: string;
  ticket_id: string;
  changed_by: string;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  created_at: string;
  changer?: Profile;
}
