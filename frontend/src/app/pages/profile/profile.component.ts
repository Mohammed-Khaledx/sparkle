import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FeedService, Post } from '../../services/feed.service';
import { CommentComponent } from '../../components/comment/comment.component';
import { HttpClient } from '@angular/common/http';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

interface UserProfile {
  _id: string;
  name: string;
  bio?: string;
  profilePicture?: {
    url: string;
  };
  followersCount: number;
  followingCount: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentComponent,SafeUrlPipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private feedService = inject(FeedService);
  private route = inject(ActivatedRoute);

  profile = signal<UserProfile | null>(null);
  userPosts = signal<Post[]>([]);
  isEditing = signal(false);
  newPost = signal('');
  isOwnProfile = signal(false);
  isFollowing = signal(false);
  selectedFile: File | null = null;
  selectedPostId = signal<string | null>(null);
  sparkedPosts = signal<Set<string>>(new Set());
  postStats = signal<{ totalPosts: number; totalSparks: number; totalComments: number } | null>(null);
  selectedPostImages: File[] = [];
  selectedImage = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const userId = params['id'] || this.getUserIdFromToken();
      this.loadProfile(userId);
      this.loadUserPosts(userId);
      this.loadUserStats(userId);
      this.checkIfOwnProfile(userId);
      if (!this.isOwnProfile()) {
        this.checkFollowStatus(userId);
      }
    });
  }

  loadProfile(userId: string) {
    this.http.get<{user: UserProfile, followersCount: number, followingCount: number}>(
      `http://localhost:3000/users/${userId}`
    ).subscribe({
      next: (response) => {
        this.profile.set({
          ...response.user,
          followersCount: response.followersCount,
          followingCount: response.followingCount
        });
      },
      error: (err) => console.error('Error loading profile:', err)
    });
  }

  loadUserPosts(userId: string) {
    this.feedService.getUserPosts(userId).subscribe({
      next: (posts) => {
        this.userPosts.set(posts || []); // Ensure we always set an array
        // Initialize sparked posts
        const currentUserId = this.getUserIdFromToken();
        posts?.forEach(post => {
          if (post.sparks?.includes(currentUserId)) {
            this.sparkedPosts.update(set => new Set([...set, post._id]));
          }
        });
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.userPosts.set([]); // Set empty array on error
      }
    });
  }

  loadUserStats(userId: string) {
    this.feedService.getUserPostStats(userId).subscribe({
      next: (stats) => this.postStats.set(stats),
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  checkIfOwnProfile(userId: string) {
    const currentUserId = this.getUserIdFromToken();
    this.isOwnProfile.set(userId === currentUserId);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      this.uploadProfilePicture();
    }
  }

  uploadProfilePicture() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('profilePicture', this.selectedFile);

    this.http.put('http://localhost:3000/users/profile/picture', formData).subscribe({
      next: (response: any) => {
        this.profile.update(p => p ? { ...p, profilePicture: response.profilePicture.url } : null);
      },
      error: (err) => console.error('Error uploading picture:', err)
    });
  }

  updateProfile(formData: Partial<UserProfile>) {
    const userId = this.getUserIdFromToken();
    this.http.patch(`http://localhost:3000/users/${userId}`, formData).subscribe({
      next: (response: any) => {
        this.profile.set(response);
        this.isEditing.set(false);
      },
      error: (err) => console.error('Error updating profile:', err)
    });
  }

  createPost() {
    if (!this.newPost().trim()) return;

    this.feedService.createPost(this.newPost(), this.selectedPostImages).subscribe({
      next: (post) => {
        this.userPosts.update(posts => [post, ...posts]);
        this.newPost.set('');
        this.selectedPostImages = []; // Reset selected images
        // Reset file input
        const fileInput = document.getElementById('post-images') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Update stats
        this.postStats.update(stats => stats ? {
          ...stats,
          totalPosts: stats.totalPosts + 1
        } : null);
      },
      error: (err) => console.error('Error creating post:', err)
    });
  }

  toggleFollow(userId: string) {
    const action = this.isFollowing() ? 'unfollow' : 'follow';
    this.http.post(`http://localhost:3000/followOrUnfollow/${userId}/${action}`, {}).subscribe({
      next: () => {
        this.isFollowing.update(state => !state);
        this.profile.update(p => p ? {
          ...p,
          followersCount: p.followersCount + (this.isFollowing() ? 1 : -1)
        } : null);
      },
      error: (err) => console.error('Error toggling follow:', err)
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

  // Add missing methods for post interactions
  hasSparked(postId: string): boolean {
    return this.sparkedPosts().has(postId);
  }

  toggleSpark(postId: string) {
    this.feedService.sparkPost(postId).subscribe({
      next: (response) => {
        this.userPosts.update(posts => 
          posts.map(post => 
            post._id === postId 
              ? { ...post, sparkCount: response.sparkCount } 
              : post
          )
        );
        this.sparkedPosts.update(sparked => {
          const newSparked = new Set(sparked);
          if (sparked.has(postId)) {
            newSparked.delete(postId);
          } else {
            newSparked.add(postId);
          }
          return newSparked;
        });
      },
      error: (err) => console.error('Error toggling spark:', err)
    });
  }

  openComments(postId: string) {
    this.selectedPostId.update(current => 
      current === postId ? null : postId
    );
  }

  updatePostCommentCount(postId: string, newCount: number) {
    this.userPosts.update(posts =>
      posts.map(post =>
        post._id === postId
          ? { ...post, commentCount: newCount }
          : post
      )
    );
  }

  private checkFollowStatus(userId: string) {
    if (!this.isOwnProfile()) {
      this.http.get<{ isFollowing: boolean }>(
        `http://localhost:3000/followOrUnfollow/${userId}/status`
      ).subscribe({
        next: (response) => this.isFollowing.set(response.isFollowing),
        error: (err) => console.error('Error checking follow status:', err)
      });
    }
  }

  onPostImagesSelected(event: Event) {
    const fileList = (event.target as HTMLInputElement).files;
    if (fileList) {
      this.selectedPostImages = Array.from(fileList).slice(0, 5); // Limit to 5 images
    }
  }

  openImageViewer(imageUrl: string) {
    this.selectedImage.set(imageUrl);
  }

  closeImageViewer() {
    this.selectedImage.set(null);
  }
}
