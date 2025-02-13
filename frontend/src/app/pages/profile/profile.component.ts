import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FeedService, Post } from '../../services/feed.service';
import { CommentComponent } from '../../components/comment/comment.component';
import { HttpClient } from '@angular/common/http';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { FollowStoreService } from '../../services/follow-store.service';
import { AdviceComponent } from '../../components/advice/advice.component';


interface User {
  _id: string;
  name: string;
  profilePicture?: {
    url: string;
  };
}

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
  imports: [CommonModule, FormsModule, CommentComponent,SafeUrlPipe,AdviceComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private feedService = inject(FeedService);
  private route = inject(ActivatedRoute);
  public followStore = inject(FollowStoreService);

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
  // Add new signals for active tab and followers/following lists
  activeTab = signal<'posts' | 'connections'>('posts');
  followers = signal<User[]>([]);
  following = signal<User[]>([]);
  followStatus = signal<Map<string, boolean>>(new Map());
  showFollowers = signal(true);
  isGenerating = signal(false);
  selectedTopic = signal<string>('');




  ngOnInit() {
    this.route.params.subscribe(params => {
      const userId = params['id'] || this.getUserIdFromToken();
      if (!userId) return;

      // Reset follow signals via the store
      this.followStore.followStatus.set(new Map());
      this.followStore.followers.set([]);
      this.followStore.following.set([]);
      
      // Load all profile data
      this.loadProfile(userId);
      this.loadUserPosts(userId);
      this.loadUserStats(userId);
      this.followStore.loadFollowers(userId);
      this.followStore.loadFollowing(userId);
      this.checkIfOwnProfile(userId);
      
      // Check follow status only if not own profile
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

  // Simpler method to check if we're following someone
  isUserFollowing(userId?: string): boolean {
    const targetId = userId || this.profile()?._id;
    return targetId ? this.followStore.followStatus().get(targetId) || false : false;
  }

  // Simplified toggle follow method
  toggleFollow(userId: string) {
    if (!userId || this.isCurrentUser(userId)) return;
    
    const currentlyFollowing = this.followStore.followStatus().get(userId) || false;
    this.followStore.toggleFollow(userId, currentlyFollowing).subscribe({
      next: () => {
        this.followStore.updateFollowStatus(userId, !currentlyFollowing);
        this.profile.update(p => p ? { 
          ...p, 
          followersCount: p.followersCount + (currentlyFollowing ? -1 : 1) 
        } : null);
        this.followStore.loadFollowers(userId);
        this.followStore.loadFollowing(userId);
      },
      error: (err) => {
        console.error('Error toggling follow:', err);
        // Optionally, you can trigger a status refresh here.
        if (this.profile()?._id) {
          const profileId = this.profile()?._id;
          if (profileId) {
            this.followStore.loadFollowers(profileId);
          }
          if (profileId) {
            this.followStore.loadFollowing(profileId);
          }
          
        }
      }
    });
  }

  public getUserIdFromToken(): string {
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
    if (!userId) return;
    
    this.http.get<{ isFollowing: boolean }>(
      `http://localhost:3000/followOrUnfollow/${userId}/status`
    ).subscribe({
      next: (response) => {
        this.followStore.updateFollowStatus(userId, response.isFollowing);
      },
      error: (err) => {
        console.error('Error checking follow status:', err);
        // Remove status on error
        this.followStore.updateFollowStatus(userId, false);
      }
    });
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

  // Load followers and following
  loadFollowers(userId: string) {
    if (!userId) return;
    
    this.http.get<{ data: any[] }>(
      `http://localhost:3000/followOrUnfollow/${userId}?type=followers`
    ).subscribe({
      next: (response) => {
        const followers = response.data.map(f => f.follower);
        this.followers.set(followers);
        
        // Check follow status for each follower
        const currentUserId = this.getUserIdFromToken();
        followers.forEach(user => {
          if (user._id !== currentUserId) {
            this.checkFollowStatus(user._id);
          }
        });
      },
      error: (err) => {
        console.error('Error loading followers:', err);
        this.followers.set([]);
      }
    });
  }

  loadFollowing(userId: string) {
    if (!userId) return;
    
    this.http.get<{ data: any[] }>(
      `http://localhost:3000/followOrUnfollow/${userId}?type=following`
    ).subscribe({
      next: (response) => {
        const following = response.data.map(f => f.following);
        this.following.set(following);
        
        // All users in following list are being followed by default
        following.forEach(user => {
          this.followStore.updateFollowStatus(user._id, true);
        });
      },
      error: (err) => {
        console.error('Error loading following:', err);
        this.following.set([]);
      }
    });
  }

  // Add method to check follow status for any user
  isUserFollowed(userId: string): boolean {
    return this.followStore.followStatus().get(userId) || false;
  }

  toggleConnectionsView(view: 'followers' | 'following') {
    this.showFollowers.set(view === 'followers');
  }

  // Helper method to check if user is current user
  isCurrentUser(userId: string): boolean {
    return userId === this.getUserIdFromToken();
  }

  // private updateFollowStatus(userId: string, isFollowing: boolean) {
  //   this.followStatus.update(map => {
  //     const newMap = new Map(map);
  //     newMap.set(userId, isFollowing);
  //     return newMap;
  //   });
  // }

  // private updateUserLists(userId: string, isFollowing: boolean) {
  //   if (this.showFollowers()) {
  //     if (!isFollowing) {
  //       // Add to followers
  //       const userToAdd = this.following().find(u => u._id === userId);
  //       if (userToAdd) {
  //         this.followers.update(list => [userToAdd, ...list]);
  //       }
  //     } else {
  //       // Remove from followers
  //       this.followers.update(list => list.filter(u => u._id !== userId));
  //     }
  //   }

  //   if (isFollowing) {
  //     // Remove from following
  //     this.following.update(list => list.filter(u => u._id !== userId));
  //   }
  // }

  // // Helper method for follow status updates
  // private updateFollowStatus(userId: string, isFollowing: boolean) {
  //   if (!userId) return;
    
  //   this.followStore.followStatus.update(map => {
  //     const newMap = new Map(map);
  //     newMap.set(userId, isFollowing);
  //     return newMap;
  //   });
  // }
  generateAIPost() {
    const topic = this.selectedTopic()?.trim();
    if (!topic) {
      console.warn('Please enter a topic first');
      return;
    }
  
    this.isGenerating.set(true);
    this.feedService.generateAIPostContent(topic).subscribe({
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
}
