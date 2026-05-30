export interface Staff {
  id: string;
  chat_id: number;
  username: string;
  role: string;
  is_active: boolean;
  last_activity: string; // from logs
}

export interface AdminActionLog {
  id: string;
  timestamp: string;
  admin_name: string;
  action: string;
  details: string;
}
