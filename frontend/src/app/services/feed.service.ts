import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';

export interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    profilePicture?: {
      url: string;  // Will now contain complete URL
    };
  };
  images: string[]; // Array of complete image URLs
  sparks: string[];
  comments: any[];
  sparkCount: number;
  commentCount: number;
  adviceCount: number;
  createdAt: string;
}

interface SparkResponse {
  message: string;
  sparkCount: number;
  sparks: string[];
}

export interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
}

interface CommentResponse {
  message: string;
  comment: Comment;
  commentCount: number;
}

interface FeedResponse {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}
@Injectable({
  providedIn: 'root',
})
export class FeedService {
  private apiUrl = 'http://localhost:3000/posts'; // Change to your backend URL
  private defaultAvatar = '/assets/images/default-avatar.png';

  getProfileImage(profilePicture?: { url: string }) {
    return profilePicture?.url || this.defaultAvatar;
  }
  httpClient = inject(HttpClient);


  // Get feed posts (posts from followed users)
  getFeed(page: number = 1, limit: number = 10): Observable<FeedResponse> {
    return this.httpClient.get<FeedResponse>(`${this.apiUrl}/feed?page=${page}&limit=${limit}`);
  }

  // Get specific user's posts
  getUserPosts(userId: string): Observable<Post[]> {
    return this.httpClient.get<Post[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching user posts:', error);
        return of([]); // Return empty array on error
      })
    );
  }
  // Update createPost to handle images
  createPost(content: string, images?: File[]): Observable<Post> {
    const formData = new FormData();
    formData.append('content', content);
    
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }
    
    return this.httpClient.post<Post>(this.apiUrl, formData);
  }

  // Handle post sparks (likes)
  sparkPost(postId: string): Observable<SparkResponse> {
    return this.httpClient.put<SparkResponse>(`${this.apiUrl}/spark/${postId}`, {});
  }

  // Get post comments
  getComments(postId: string): Observable<{ comments: Comment[] }> {
    return this.httpClient.get<{ comments: Comment[] }>(`${this.apiUrl}/${postId}/comments`);
  }

  // Add comment to post
  addComment(postId: string, content: string): Observable<CommentResponse> {
    return this.httpClient.post<CommentResponse>(`${this.apiUrl}/comment/${postId}`, { content });
  }

  // Get user's post stats
  getUserPostStats(userId: string): Observable<{
    totalPosts: number;
    totalSparks: number;
    totalComments: number;
  }> {
    return this.httpClient.get<any>(`${this.apiUrl}/user/${userId}/stats`);
  }

  // Get a single post by ID
  getPostById(postId: string): Observable<Post> {
    return this.httpClient.get<Post>(`${this.apiUrl}/${postId}`);
  }

  // Update post content
  updatePost(postId: string, content: string): Observable<Post> {
    return this.httpClient.patch<Post>(`${this.apiUrl}/${postId}`, { content });
  }

  // Delete post
  deletePost(postId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/${postId}`);
  }

  // Upload post image
  uploadPostImage(postId: string, imageFile: File): Observable<Post> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.httpClient.post<Post>(`${this.apiUrl}/${postId}/image`, formData);
  }

  // Get all posts (with pagination)
  getAllPosts(page: number = 1, limit: number = 10): Observable<FeedResponse> {
    return this.httpClient.get<FeedResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  // Get post counts (sparks & comments)
  getPostCounts(postId: string): Observable<{ sparkCount: number; commentCount: number }> {
    return this.httpClient.get<{ sparkCount: number; commentCount: number }>(`${this.apiUrl}/${postId}/counts`);
  }
  generateAIPostContent(topic: string) {
    // Ensure the topic is properly encoded in the URL
    const encodedTopic = encodeURIComponent(topic || 'technology');
    return this.httpClient.get<{ content: string }>(
      `${this.apiUrl}/generate?prompt=${encodedTopic}`
    ).pipe(
      catchError(error => {
        console.error('AI Generation Error:', error);
        return throwError(() => new Error('Failed to generate AI content'));
      })
    );
  }

  addAdvice(postId: string, content: string): Observable<{ adviceCount: number }> {
    return this.httpClient.post<{ adviceCount: number }>(
      `${this.apiUrl}/${postId}/advice`, // Remove the extra 'posts' in the URL
      { content }
    ).pipe(
      catchError(error => {
        console.error('Error adding advice:', error);
        return throwError(() => new Error('Failed to add advice'));
      })
    );
  }
}
