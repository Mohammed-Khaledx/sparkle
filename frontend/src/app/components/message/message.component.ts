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
interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  createdAt: string;
  read: boolean;
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
  recentMessageUsers = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  messages = signal<Message[]>([]); // Type the messages array
  currentUserId = this.getUserIdFromToken();
  newMessage = ''; // Regular string property for ngModel

  ngOnInit() {
    this.loadFollowedUsers();
    this.loadRecentMessages();
    
    this.messageService.getNewMessages().subscribe(message => {
      if (this.selectedUser()?._id === message.sender._id || 
          this.selectedUser()?._id === message.receiver._id) {
        this.messages.update(msgs => [...msgs, message]);
      }
      
      if (message.sender._id !== this.currentUserId) {
        this.addToRecentUsers(message.sender);
      }
    });
  }

  loadRecentMessages() {
    this.messageService.getRecentMessages().subscribe({
      next: (response) => {
        const recentUsers = response.messages
          .map(msg => msg.sender._id === this.currentUserId ? msg.receiver : msg.sender)
          .filter((user, index, self) => 
            index === self.findIndex(u => u._id === user._id)
          );
        this.recentMessageUsers.set(recentUsers);
      },
      error: (err) => console.error('Error loading recent messages:', err)
    });
  }

  private addToRecentUsers(user: User) {
    this.recentMessageUsers.update(users => {
      const exists = users.some(u => u._id === user._id);
      if (!exists) {
        return [user, ...users];
      }
      return users;
    });
  }

  loadFollowedUsers() {
    const userId = this.currentUserId;
    if (!userId) return;
    
    this.http.get<{ data: FollowedUser[] }>(
      `http://localhost:3000/followOrUnfollow/${userId}?type=following`
    ).subscribe({
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
    if (!this.newMessage.trim() || !this.selectedUser()) return;

    this.messageService.sendMessage(
      this.selectedUser()?._id!, 
      this.newMessage
    ).subscribe({
      next: (message) => {
        this.messages.update(msgs => [...msgs, message]);
        this.newMessage = ''; // Clear the input
        this.addToRecentUsers(this.selectedUser()!);
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