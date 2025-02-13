import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

interface Advice {
  _id: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  createdAt: string;
}

@Component({
  selector: 'app-advice',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="advices-container" *ngIf="isOwnPost">
      <h3>Advices ({{ advices().length }})</h3>
      <div class="advice-list">
        <div *ngFor="let advice of advices()" class="advice-item">
          <div class="advice-header">
            <img [src]="advice.user.profilePicture || '/assets/images/default-avatar.png'" 
                 alt="User avatar" 
                 class="advice-avatar">
            <div class="advice-meta">
              <strong>{{ advice.user.name }}</strong>
              <span class="advice-date">{{ advice.createdAt | date:'medium' }}</span>
            </div>
          </div>
          <p class="advice-content">{{ advice.content }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .advices-container {
      padding: 1rem;
      background: var(--background-secondary);
      border-radius: var(--radius-lg);
      margin-top: 1rem;
    }

    .advice-list {
      margin-top: 1rem;
    }

    .advice-item {
      padding: 1rem;
      background: var(--background-primary);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }

    .advice-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .advice-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .advice-meta {
      display: flex;
      flex-direction: column;
    }

    .advice-date {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .advice-content {
      color: var(--text-primary);
      line-height: 1.5;
    }
  `]
})
export class AdviceComponent implements OnInit {
  @Input() postId!: string;
  @Input() authorId!: string;
  
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  advices = signal<Advice[]>([]);
  isOwnPost = false;

  ngOnInit() {
    const currentUserId = this.getUserIdFromToken();
    this.isOwnPost = currentUserId === this.authorId;
    
    if (this.isOwnPost) {
      this.loadAdvices();
      
      // Listen for new advice notifications
      this.notificationService.getNotifications().subscribe(notification => {
        if (notification.type === 'advice' && notification.target === this.postId) {
          this.loadAdvices(); // Refresh advices when new one is received
        }
      });
    }
  }

  private loadAdvices() {
    this.http.get<{ advices: Advice[] }>(`http://localhost:3000/posts/${this.postId}/advices`)
      .subscribe({
        next: (response) => this.advices.set(response.advices),
        error: (err) => console.error('Error loading advices:', err)
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