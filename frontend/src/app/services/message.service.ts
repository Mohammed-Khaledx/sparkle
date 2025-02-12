// src/app/services/message.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of, throwError } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { map, catchError } from 'rxjs/operators';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  receiver: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  createdAt: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private http = inject(HttpClient);
  private socket: Socket;
  private apiUrl = 'http://localhost:3000/messages';
  private messageSubject = new Subject<Message>();
  private unreadCount = signal(0);

  constructor() {
    this.socket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    this.initializeSocketListeners();
  }

  private initializeSocketListeners() {
    this.socket.on('message', (data: Message) => {
      this.messageSubject.next(data);
      const currentUserId = this.getUserIdFromToken();
      if (data.receiver._id === currentUserId) {
        this.unreadCount.update(count => count + 1);
      }
    });
  }

  private getUserIdFromToken(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return '';
    }
  }

  getUnreadCount() {
    return this.unreadCount;
  }

  resetUnreadCount() {
    this.unreadCount.set(0);
    return this.http.post(`${this.apiUrl}/mark-all-read`, {}).subscribe();
  }

  getRecentMessages(): Observable<{ messages: Message[] }> {
    return this.http.get<{ messages: Message[] }>(`${this.apiUrl}/recent`).pipe(
      map(response => ({
        messages: response.messages?.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) || []
      })),
      catchError(error => {
        console.error('Error fetching recent messages:', error);
        return of({ messages: [] });
      })
    );
  }

  getNewMessages(): Observable<Message> {
    return this.messageSubject.asObservable();
  }

  sendMessage(receiverId: string, content: string): Observable<Message> {
    return this.http.post<Message>(this.apiUrl, { receiver: receiverId, content });
  }

  getMessages(otherUserId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${otherUserId}`);
  }

  markAsRead(messageId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/seen/${messageId}`, {}).pipe(
      catchError(error => {
        console.error('Error marking message as read:', error);
        return throwError(() => error);
      })
    );
  }

  markAllAsRead(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mark-all-read/${userId}`, {});
  }

  // Cleanup method
  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}