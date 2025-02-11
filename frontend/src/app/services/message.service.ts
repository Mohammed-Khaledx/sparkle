// src/app/services/message.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

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
  private apiUrl = 'http://localhost:3000/messages';
  private messageSubject = new Subject<Message>();
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    this.socket.on('message', (data: Message) => {
      this.messageSubject.next(data);
    });
  }

  sendMessage(receiverId: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}`, { receiver: receiverId, content });
  }

  getMessages(otherUserId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${otherUserId}`);
  }

  getNewMessages(): Observable<Message> {
    return this.messageSubject.asObservable();
  }
}