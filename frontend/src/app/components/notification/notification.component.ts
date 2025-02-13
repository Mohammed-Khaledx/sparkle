import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

interface Notification {
  _id: string;
  sender: {
    name: string;
    profilePicture?: string;
  };
  message: string;
  type: 'follow' | 'spark' | 'comment' | 'mention' | 'advice';
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  private notificationService = inject(NotificationService);
  notifications = signal<Notification[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadNotifications();

    // Mark all as read when component loads
    this.markAllAsRead();
    
    // Subscribe to real-time notifications
    this.notificationService.getNotifications().subscribe(notification => {
      this.notifications.update(current => [notification, ...current]);
    });
  }

  private loadNotifications() {
    this.notificationService.fetchNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data.notifications);
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
      },
      error: (err) => console.error('Error marking notification as read:', err)
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(n => ({ ...n, isRead: true }))
        );
      },
      error: (err) => console.error('Error marking all notifications as read:', err)
    });
  }
}