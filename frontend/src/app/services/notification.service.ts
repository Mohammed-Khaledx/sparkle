import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

interface NotificationData {
  _id: string;
  sender: {
    name: string;
    profilePicture?: string;
  };
  type: 'follow' | 'spark' | 'comment' | 'mention';
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCount = signal(0);
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/notifications';
  private notificationSubject = new Subject<NotificationData>();
  private socket: Socket;



  constructor() {
    // Initialize socket connection with auth token
    this.socket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    // Initialize unread count
    this.fetchUnreadCount();

    // Listen for new notifications
    this.socket.on('notification', (data: NotificationData) => {
      this.notificationSubject.next(data);
      this.unreadCount.update(count => count + 1);
    });
  }

  private fetchUnreadCount() {
    this.http.get<{ count: number }>(`${this.apiUrl}/unread/count`)
      .subscribe({
        next: (response) => this.unreadCount.set(response.count),
        error: (err) => console.error('Error fetching unread count:', err)
      });
  }

  getNotifications(): Observable<NotificationData> {
    return this.notificationSubject.asObservable();
  }

  fetchNotifications() {
    return this.http.get<{ notifications: NotificationData[] }>(this.apiUrl);
  }

  markAsRead(notificationId: string) {
    return this.http.patch(`${this.apiUrl}/${notificationId}/read`, {});
  }

  getUnreadCount() {
    return this.unreadCount;
  }

  resetUnreadCount() {
    this.unreadCount.set(0);
    return this.http.post(`${this.apiUrl}/mark-all-read`, {});
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}