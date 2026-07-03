import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  private http = inject(HttpClient);

  private api =
    `${environment.apiUrl}/notifications`;

  getNotifications() {
    return this.http.get<any>(
      this.api,
      {
        withCredentials: true,
      }
    );
  }

  getUnreadCount() {
    return this.http.get<any>(
      `${this.api}/unread-count`,
      {
        withCredentials: true,
      }
    );
  }

  markAsRead(
    id: number | string
  ) {
    return this.http.patch(
      `${this.api}/${id}/read`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  markAllAsRead() {
    return this.http.patch(
      `${this.api}/read-all`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  deleteNotification(
    id: number | string
  ) {
    return this.http.delete(
      `${this.api}/${id}`,
      {
        withCredentials: true,
      }
    );
  }

  deleteAll() {
    return this.http.delete(
      this.api,
      {
        withCredentials: true,
      }
    );
  }
}