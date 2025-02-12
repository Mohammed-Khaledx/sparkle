// src/app/components/messages/messages.component.ts
import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
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
  styleUrls: ['./message.component.css'],
})
export class MessageComponent implements OnInit {
  private messageService = inject(MessageService);
  private http = inject(HttpClient);

  followedUsers = signal<FollowedUser[]>([]);
  recentMessageUsers = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  messages = signal<Message[]>([]);
  currentUserId = this.getUserIdFromToken();
  newMessage = signal(''); // Change to signal
  isFollowListOpen = signal(false);
  unreadMessages = signal<Set<string>>(new Set());
  lastMessages = signal<{ [key: string]: Message }>({});

  ngOnInit() {
    this.loadFollowedUsers();
    this.loadRecentMessages();

    this.messageService.getNewMessages().subscribe((message) => {
      if (
        this.selectedUser()?._id === message.sender._id ||
        this.selectedUser()?._id === message.receiver._id
      ) {
        this.messages.update((msgs) => [...msgs, message]);
        if (message.receiver._id === this.currentUserId) {
          this.messageService.markAsRead(message._id);
        }
      } else if (message.receiver._id === this.currentUserId) {
        this.unreadMessages.update((set) =>
          new Set(set).add(message.sender._id)
        );
      }

      this.updateLastMessage(message);

      if (message.sender._id !== this.currentUserId) {
        this.addToRecentUsers(message.sender);
      }
    });
  }

  loadRecentMessages() {
    this.messageService.getRecentMessages().subscribe({
      next: (response) => {
        if (!response.messages) {
          this.recentMessageUsers.set([]);
          return;
        }

        // Get unique users from recent messages
        const recentUsers = response.messages.reduce(
          (users: User[], msg: Message) => {
            const otherUser =
              msg.sender._id === this.currentUserId ? msg.receiver : msg.sender;
            if (!users.some((u) => u._id === otherUser._id)) {
              users.push(otherUser);
            }
            // Update last message for this user
            this.lastMessages.update((msgs) => ({
              ...msgs,
              [otherUser._id]: msg,
            }));
            return users;
          },
          []
        );

        this.recentMessageUsers.set(recentUsers);
      },
      error: (err) => {
        console.error('Error loading recent messages:', err);
        this.recentMessageUsers.set([]);
      },
    });
  }

  private addToRecentUsers(user: User) {
    this.recentMessageUsers.update((users) => {
      const exists = users.some((u) => u._id === user._id);
      if (!exists) {
        return [user, ...users];
      }
      return users;
    });
  }

  loadFollowedUsers() {
    const userId = this.currentUserId;
    if (!userId) return;

    this.http
      .get<{ data: FollowedUser[] }>(
        `http://localhost:3000/followOrUnfollow/${userId}?type=following`
      )
      .subscribe({
        next: (response) => {
          this.followedUsers.set(response.data);
        },
        error: (err) => console.error('Error loading followed users:', err),
      });
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
    if (this.unreadMessages().has(user._id)) {
      this.unreadMessages.update((set) => {
        const newSet = new Set(set);
        newSet.delete(user._id);
        return newSet;
      });
    }
    this.loadMessages(user._id);
  }

  loadMessages(userId: string) {
    this.messageService.getMessages(userId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
      },
      error: (err) => console.error('Error loading messages:', err),
    });
  }

  sendMessage() {
    if (!this.newMessage().trim() || !this.selectedUser()) return;

    this.messageService
      .sendMessage(this.selectedUser()?._id!, this.newMessage())
      .subscribe({
        next: (message) => {
          this.messages.update((msgs) => [...msgs, message]);
          this.newMessage.set(''); // Update to use signal
          this.addToRecentUsers(this.selectedUser()!);
        },
        error: (err) => console.error('Error sending message:', err),
      });
  }

  toggleFollowList() {
    this.isFollowListOpen.update((state) => !state);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const dropdown = (event.target as HTMLElement).closest(
      '.followed-users-dropdown'
    );
    if (!dropdown && this.isFollowListOpen()) {
      this.isFollowListOpen.set(false);
    }
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

  private updateLastMessage(message: Message) {
    this.lastMessages.update((msgs) => ({
      ...msgs,
      [message.sender._id === this.currentUserId
        ? message.receiver._id
        : message.sender._id]: message,
    }));
  }

  hasUnreadMessages(userId: string): boolean {
    return this.unreadMessages().has(userId);
  }

  getLastMessage(userId: string): Message | undefined {
    return this.lastMessages()[userId];
  }
}
