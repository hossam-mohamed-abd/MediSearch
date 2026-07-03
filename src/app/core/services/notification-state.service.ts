import {
  Injectable,
  signal,
  computed,
} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationStateService {

  notifications =
    signal<any[]>([]);

  notificationCount =
    computed(
      () =>
        this.notifications()
          .filter(
            x => !x.is_read
          )
          .length
    );

  setNotifications(
    notifications: any[]
  ) {
    this.notifications.set(
      notifications
    );
  }

  addNotification(
    notification: any
  ) {
    this.notifications.update(
      list => [
        notification,
        ...list,
      ]
    );
  }

  removeNotification(
    id: number | string
  ) {
    this.notifications.update(
      list =>
        list.filter(
          x => x.id != id
        )
    );
  }

  markAsRead(
    id: number | string
  ) {
    this.notifications.update(
      list =>
        list.map(
          x =>
            x.id == id
              ? {
                  ...x,
                  is_read: true,
                }
              : x
        )
    );
  }

  markAllAsRead() {
    this.notifications.update(
      list =>
        list.map(
          x => ({
            ...x,
            is_read: true,
          })
        )
    );
  }

  clear() {
    this.notifications.set([]);
  }
}