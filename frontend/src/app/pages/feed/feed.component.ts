import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedService } from '../../services/feed.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css',
})
export class FeedComponent {
  feedService = inject(FeedService);
  posts = signal<any[]>([]);

  currentPage = 1;
  loading = signal(false);
  hasMore = signal(true); // Track if more posts are available

  ngOnInit() {
    this.loadFeed();
  }

  loadFeed() {
    if (this.loading()) return;
    this.loading.set(true);
    this.feedService.getFeed(this.currentPage).subscribe((data) => {
      if (data.posts.length === 0) {
        this.hasMore.set(false);
      } else {
        this.posts.set([...this.posts(), ...data.posts]); // Append new posts
        this.currentPage++; // Move to next page
      }
      this.loading.set(false);
    });
  }
}
