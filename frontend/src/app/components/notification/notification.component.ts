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
  type: 'follow' | 'spark' | 'comment' | 'mention';
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <h2>Notifications</h2>
      <div class="notification-list">
        <div *ngFor="let notification of notifications()" 
             class="notification-item"
             [class.unread]="!notification.isRead">
          <div class="notification-content">
            <img [src]="notification.sender.profilePicture || 'assets/default-avatar.png'" 
                 alt="Profile" 
                 class="avatar">
            <div class="notification-text">
              <p><strong>{{ notification.sender.name }}</strong> {{ notification.message }}</p>
              <span class="notification-time">{{ notification.createdAt | date:'short' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  private notificationService = inject(NotificationService);
  notifications = signal<Notification[]>([]);

  ngOnInit() {
    // Load initial notifications
    this.loadNotifications();

    this.notificationService.resetUnreadCount();

    
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
}