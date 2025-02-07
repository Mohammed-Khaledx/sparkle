import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedService } from '../../services/feed.service';

@Component({
  selector: 'app-feed',
  imports: [CommonModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent {
  feedService = inject(FeedService);
  posts = signal<any[]>([]);


 
  ngOnInit() {
    this.loadFeed();
  }

  loadFeed() {
    this.feedService.getFeed().subscribe((data) => {
      this.posts.set(data.posts);
    });
  }
}
