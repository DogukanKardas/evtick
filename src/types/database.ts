export type UserRole = "employee" | "support" | "admin" | "super_admin";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Company {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_by: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
}

export interface CompanyWithStats extends Company {
  user_count: number;
  ticket_count: number;
  open_tickets: number;
  last_ticket_at: string | null;
  days_since_activity: number | null;
}

export interface CompaniesPageSummary {
  total_companies: number;
  active_companies: number;
  inactive_companies: number;
  total_users: number;
  total_open_tickets: number;
}

export interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  created_at: string;
  company?: Company;
}

export interface ProfileWithCompany extends Profile {
  company?: Company;
}

export interface AdminsPageSummary {
  total_admins: number;
  admins_added_this_month: number;
  promotable_users: number;
  admin_actions_this_week: number;
}

export interface TicketsPageSummary {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  urgent_open: number;
  tickets_today: number;
  unassigned_open: number;
}

export interface PlatformStats {
  total_companies: number;
  active_companies: number;
  inactive_companies: number;
  total_users: number;
  total_tickets: number;
  open_tickets: number;
  tickets_today: number;
  resolved_this_week: number;
  avg_resolution_hours: number | null;
  urgent_open_tickets: number;
}

export interface TicketPriorityCount {
  priority: TicketPriority;
  count: number;
}

export interface DashboardAuditActivity {
  id: string;
  action: string;
  action_label: string;
  actor_name: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  href?: string;
}

export interface EmployeeDashboardSummary {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  urgent_open: number;
  tickets_today: number;
  awaiting_response: number;
}

export interface TicketStatusCount {
  status: TicketStatus;
  count: number;
}

export interface TicketTrendDay {
  date: string;
  count: number;
}

export interface PlatformActivity {
  id: string;
  type: "company" | "user" | "ticket";
  title: string;
  subtitle: string;
  created_at: string;
  href?: string;
}

export interface PlatformAlert {
  id: string;
  type: "high_open_tickets" | "inactive_company";
  message: string;
  href?: string;
  days?: number;
}

export interface AuditPageSummary {
  total_logs: number;
  logs_today: number;
  logs_this_week: number;
  company_actions: number;
  user_actions: number;
  ticket_actions: number;
}

export interface SystemAuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile | null;
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
  company?: Company;
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

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Çalışan",
  support: "IT Destek",
  admin: "Yönetici",
  super_admin: "Sistem Yöneticisi",
};

export const ASSIGNABLE_ROLES: UserRole[] = ["employee", "support", "admin"];
