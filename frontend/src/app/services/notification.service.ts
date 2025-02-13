import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

interface NotificationData {
  _id: string;
  sender: {
    name: string;
    profilePicture?: string;
  };
  type: 'follow' | 'spark' | 'comment' | 'mention' | 'advice'; // Add 'advice' type
  message: string;
  target:string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket: Socket;
  private notificationSubject = new Subject<NotificationData>();
  private apiUrl = 'http://localhost:3000/notifications';
  unreadCount = signal<number>(0);
  private http = inject(HttpClient)

  constructor() {
    this.socket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    this.initializeSocketListeners();
    this.fetchUnreadCount();
  }

  private initializeSocketListeners() {
    this.socket.on('notification', (data: NotificationData) => {
      // Handle advice notifications specifically
      if (data.type === 'advice') {
        // You might want to show a special toast or alert for advice
        console.log('New advice received:', data);
      }
      this.notificationSubject.next(data);
      this.unreadCount.update(count => count + 1);
    });
  }

  private fetchUnreadCount() {
    // Fix: Change the endpoint URL to match the backend route
    this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`)
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

  // Mark single notification as read
  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Decrease unread count
        this.unreadCount.update(count => Math.max(0, count - 1));
      }),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        return throwError(() => error);
      })
    );
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        // Reset unread count to 0
        this.unreadCount.set(0);
      }),
      catchError(error => {
        console.error('Error marking all notifications as read:', error);
        return throwError(() => error);
      })
    );
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