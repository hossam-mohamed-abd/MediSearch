export interface Notification {
  id: number;

  user_id: number;

  notification_type: string;

  title: string;

  message: string;

  is_read: boolean;

  created_at: string;
}
