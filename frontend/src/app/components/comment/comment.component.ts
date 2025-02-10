import { Component, Input, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Comment } from '../../services/feed.service';
import { CommonModule } from '@angular/common';
import { FeedService } from '../../services/feed.service';
import { FeedComponent } from '../../pages/feed/feed.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-comment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
})
export class CommentComponent implements OnInit {
  @Input() postId!: string;
  @Output() commentCountChanged = new EventEmitter<number>();
  
  private feedService = inject(FeedService);
  private notificationService = inject(NotificationService);
  comments = signal<Comment[]>([]);
  newComment = signal('');

  ngOnInit() {
    if (this.postId) {
      this.loadComments();
    }
  }

  loadComments() {
    this.feedService.getComments(this.postId).subscribe({
      next: (data) => {
        this.comments.set(data.comments);
      },
      error: (err) => console.error('Error loading comments:', err)
    });
  }

  addComment() {
    if (!this.newComment().trim()) return;

    this.feedService.addComment(this.postId, this.newComment()).subscribe({
      next: (response) => {
        // Add new comment to the list
        this.comments.update(current => [
          ...current, 
          response.comment
        ]);
        
        // Clear input
        this.newComment.set('');
        
        // Emit the new comment count
        this.commentCountChanged.emit(response.commentCount);

        // The notification will be handled by the socket connection
        // No need to call getNotifications() here as the socket will handle it
      },
      error: (err) => console.error('Error adding comment:', err)
    });
  }
}
