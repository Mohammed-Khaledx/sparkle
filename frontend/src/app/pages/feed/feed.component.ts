import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedService ,Post} from '../../services/feed.service';
import { CommentComponent } from '../../components/comment/comment.component';
import { NotificationService } from '../../services/notification.service';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule , CommentComponent,FormsModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css',
})
export class FeedComponent implements OnInit {
  posts = signal<Post[]>([]);
  postCounts = signal<Record<string, number>>({});
  sparkedPostsMap = signal<{[key: string]: boolean}>({});

  feedService = inject(FeedService);
  private notificationService = inject(NotificationService);

  currentPage = 1;
  loading = signal(false);
  hasMore = signal(true); // Track if more posts are available

  showAdviceDialog = signal(false);
  selectedPostForAdvice = signal<string | null>(null);
  newAdvice = signal('');

  newPost = signal('');
  selectedTopic = signal('');
  isGenerating = signal(false);
  selectedPostImages: File[] = [];

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

        // Listen for the notification
        this.notificationService.getNotifications().subscribe();
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
    this.selectedPostId.update(current => 
      current === postId ? null : postId
    );
  }

  loadPostCounts(postId: string) {
    this.feedService.getPostCounts(postId).subscribe({
      next: (data) => {
        this.postCounts.update((prev) => ({ ...prev, [postId]: data.sparkCount })); 
      },
      error: (err) => console.error("Error fetching post counts:", err),
    });
  }

  updatePostCommentCount(postId: string, newCount: number) {
    this.posts.update(posts =>
      posts.map(post =>
        post._id === postId
          ? { ...post, commentCount: newCount, comments: [...post.comments, newCount] }
          : post
      )
    );
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

  openAdviceDialog(postId: string) {
    this.selectedPostForAdvice.set(postId);
    this.showAdviceDialog.set(true);
  }
  closeAdviceDialog() {
    this.showAdviceDialog.set(false);
    this.newAdvice.set('');
  }

  submitAdvice() {
    if (!this.newAdvice().trim() || !this.selectedPostForAdvice()) return;

    this.feedService.addAdvice(
      this.selectedPostForAdvice()!, 
      this.newAdvice()
    ).subscribe({
      next: (response) => {
        // Update posts signal instead of userPosts
        this.posts.update(posts =>
          posts.map(post =>
            post._id === this.selectedPostForAdvice()
              ? { ...post, adviceCount: response.adviceCount }
              : post
          )
        );
        this.showAdviceDialog.set(false);
        this.newAdvice.set('');
        this.selectedPostForAdvice.set(null);
      },
      error: (err) => {
        console.error('Error adding advice:', err);
        // Optionally show an error message to the user
      }
    });
  }

  // Add method to check if current user is post author
  isPostAuthor(post: Post): boolean {
    const userId = this.getUserIdFromToken();
    return post.author._id === userId;
  }

  // Add methods for handling post creation
  onPostImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedPostImages = Array.from(input.files);
    }
  }

  removeImage(image: File) {
    this.selectedPostImages = this.selectedPostImages.filter(img => img !== image);
  }

  generateAIPost() {
    if (!this.selectedTopic().trim()) return;
    
    this.isGenerating.set(true);
    this.feedService.generateAIPostContent(this.selectedTopic()).subscribe({
      next: (response) => {
        this.newPost.set(response.content);
        this.isGenerating.set(false);
        this.selectedTopic.set('');
      },
      error: (err) => {
        console.error('Error generating AI post:', err);
        this.isGenerating.set(false);
      }
    });
  }

  createPost() {
    if (!this.newPost().trim()) return;

    this.feedService.createPost(this.newPost(), this.selectedPostImages).subscribe({
      next: (post) => {
        this.posts.update(posts => [post, ...posts]);
        this.newPost.set('');
        this.selectedPostImages = [];
        const fileInput = document.getElementById('post-images') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => console.error('Error creating post:', err)
    });
  }
}
