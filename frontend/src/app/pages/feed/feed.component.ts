import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedService ,Post} from '../../services/feed.service';
import { CommentComponent } from '../../comment/comment.component';
@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule , CommentComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css',
})
export class FeedComponent implements OnInit {
  posts = signal<Post[]>([]);
  postCounts = signal<Record<string, number>>({});
  sparkedPostsMap = signal<{[key: string]: boolean}>({});

  feedService = inject(FeedService);

  currentPage = 1;
  loading = signal(false);
  hasMore = signal(true); // Track if more posts are available

  ngOnInit() {
    this.loadFeed();
  }

  loadFeed() {
    if (this.loading()) return;
    this.loading.set(true);
    
    const userId = this.getUserIdFromToken();
    
    this.feedService.getFeed(this.currentPage).subscribe({
      next: (data) => {
        if (data.posts.length === 0) {
          this.hasMore.set(false);
        } else {
          // Initialize spark states for new posts
          data.posts.forEach(post => {
            this.sparkedPostsMap.update(map => ({
              ...map,
              [post._id]: userId ? post.sparks.includes(userId) : false
            }));
            
            this.postCounts.update(prev => ({
              ...prev,
              [post._id]: post.sparkCount || 0
            }));
          });
          
          this.posts.update(current => [...current, ...data.posts]);
          this.currentPage++;
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Error loading feed:", err);
        this.loading.set(false);
      }
    });
  }

  toggleSpark(postId: string) {
    const userId = this.getUserIdFromToken();
    if (!userId) return;
  
    this.feedService.sparkPost(postId).subscribe({
      next: (response) => {
        // Update spark state based on server response
        this.sparkedPostsMap.update(map => ({
          ...map,
          [postId]: response.sparks.includes(userId)
        }));
        
        // Update count from response
        this.postCounts.update(prev => ({
          ...prev,
          [postId]: response.sparkCount
        }));
  
        // Update the posts array to reflect new spark count
        this.posts.update(posts => 
          posts.map(post => 
            post._id === postId 
              ? { ...post, sparkCount: response.sparkCount, sparks: response.sparks }
              : post
          )
        );
      },
      error: (err) => console.error("Error toggling spark:", err)
    });
  }

  selectedPostId = signal<string | null>(null);
  sparkedPosts = signal<Set<string>>(new Set());

  hasSparked(postId: string): boolean {
    return this.sparkedPostsMap()[postId] ?? false;
  }
  openComments(postId: string) {
    this.selectedPostId.set(postId);
  }

  loadPostCounts(postId: string) {
    this.feedService.getPostCounts(postId).subscribe({
      next: (data) => {
        this.postCounts.update((prev) => ({ ...prev, [postId]: data.sparkCount })); 
      },
      error: (err) => console.error("Error fetching post counts:", err),
    });
  }

  private getUserIdFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }
}
