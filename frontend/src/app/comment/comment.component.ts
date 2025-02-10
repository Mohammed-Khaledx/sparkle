import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { FeedService } from '../services/feed.service';

@Component({
  selector: 'app-comment',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
})
export class CommentComponent implements OnInit {
  @Input() postId!: string;

  private feedService = inject(FeedService);
  comments = signal<any[]>([]);
  newComment = signal('');

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.feedService.getComments(this.postId).subscribe((data) => {
      this.comments.set(data.comments);
    });
  }
  addComment() {
    if (!this.newComment().trim()) return; // Prevent empty comments
  
    this.feedService.addComment(this.postId, this.newComment()).subscribe({
      next: (data) => {
        this.comments.update(prev => [...prev, data.comment]); // Update UI
        this.newComment.set(''); // Clear input
      },
      error: (err) => console.error("Error adding comment:", err),
    });
  }
}
