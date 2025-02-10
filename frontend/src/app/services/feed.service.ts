import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  sparks: string[];
  comments: any[];
  sparkCount: number;
  commentCount: number;
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

  httpClient = inject(HttpClient);

  getFeed(page: number = 1, limit: number = 10): Observable<FeedResponse> {
    return this.httpClient.get<FeedResponse>(
      `${this.apiUrl}/feed?page=${page}&limit=${limit}`
    );
  }

  sparkPost(postId: string): Observable<SparkResponse> {
    return this.httpClient.put<SparkResponse>(
      `${this.apiUrl}/spark/${postId}`,
      {}
    );
  }

  getComments(postId: string): Observable<{ comments: Comment[] }> {
    return this.httpClient.get<{ comments: Comment[] }>(
      `${this.apiUrl}/${postId}/comments`
    );
  }

  addComment(postId: string, text: string): Observable<CommentResponse> {
    return this.httpClient.post<CommentResponse>(
      `${this.apiUrl}/comment/${postId}`,
      { content: text }
    );
  }
  getPostCounts(
    postId: string
  ): Observable<{ sparkCount: number; commentCount: number }> {
    return this.httpClient.get<{ sparkCount: number; commentCount: number }>(
      `${this.apiUrl}/${postId}/counts`
    );
  }
}
