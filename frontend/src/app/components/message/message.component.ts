// src/app/components/messages/messages.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../services/message.service';
import { HttpClient } from '@angular/common/http';


interface User {
  _id: string;
  name: string;
  profilePicture?: string;
}

interface FollowedUser {
  following: User;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {
  private messageService = inject(MessageService);
  private http = inject(HttpClient);

  followedUsers = signal<FollowedUser[]>([]);
  selectedUser = signal<User | null>(null);
  messages = signal<any[]>([]);
  newMessage = signal('');
  currentUserId = this.getUserIdFromToken();

  ngOnInit() {
    this.loadFollowedUsers();
    
    // Listen for new messages
    this.messageService.getNewMessages().subscribe(message => {
      this.messages.update(msgs => [...msgs, message]);
    });
  }

  loadFollowedUsers() {
    this.http.get<{ data: FollowedUser[] }>(`http://localhost:3000/followOrUnfollow/${this.currentUserId}?type=following`)
      .subscribe({
        next: (response) => {
          
          this.followedUsers.set(response.data);
        },
        error: (err) => console.error('Error loading followed users:', err)
      });
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
    this.loadMessages(user._id);
  }

  loadMessages(userId: string) {
    this.messageService.getMessages(userId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
      },
      error: (err) => console.error('Error loading messages:', err)
    });
  }

  sendMessage() {
    if (!this.newMessage().trim() || !this.selectedUser()) return;

    this.messageService.sendMessage(this.selectedUser()?._id!, this.newMessage()).subscribe({
      next: (message) => {
        this.messages.update(msgs => [...msgs, message]);
        this.newMessage.set('');
      },
      error: (err) => console.error('Error sending message:', err)
    });
  }

  private getUserIdFromToken(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (e) {
      console.error('Error decoding token:', e);
      return '';
    }
  }
}