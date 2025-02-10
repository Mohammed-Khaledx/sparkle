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

  getComments(postId: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/${postId}/comments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }

  addComment(postId: string, text: string): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiUrl}/${postId}/comments`,
      { text },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
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
