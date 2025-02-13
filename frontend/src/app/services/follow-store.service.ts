import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({ providedIn: 'root' })
export class FollowStoreService {
  followers = signal<User[]>([]);
  following = signal<User[]>([]);
  loading = signal(false);
  followStatus = signal<Map<string, boolean>>(new Map());

  constructor(private http: HttpClient) {}

  loadFollowers(userId: string): void {
    if (!userId) return;
    this.http.get<{ data: any[] }>(`http://localhost:3000/followOrUnfollow/${userId}?type=followers`)
      .subscribe({
        next: (response) => {
          const followers = response.data.map(f => f.follower);
          this.followers.set(followers);
        },
        error: (err) => {
          console.error('Error loading followers:', err);
          this.followers.set([]);
        }
      });
  }

  loadFollowing(userId: string): void {
    if (!userId) return;
    this.http.get<{ data: any[] }>(`http://localhost:3000/followOrUnfollow/${userId}?type=following`)
      .subscribe({
        next: (response) => {
          const following = response.data.map(f => f.following);
          this.following.set(following);
          following.forEach(user => this.updateFollowStatus(user._id, true));
        },
        error: (err) => {
          console.error('Error loading following:', err);
          this.following.set([]);
        }
      });
  }

  toggleFollow(userId: string, currentStatus: boolean): Observable<any> {
    const action = currentStatus ? 'unfollow' : 'follow';
    return this.http.post(`http://localhost:3000/followOrUnfollow/${userId}/${action}`, {});
  }

  updateFollowStatus(userId: string, isFollowing: boolean): void {
    this.followStatus.update(map => {
      const newMap = new Map(map);
      newMap.set(userId, isFollowing);
      return newMap;
    });
  }

  isFollowing(userId: string): boolean {
    return this.followStatus().get(userId) || false;
  }

  getCurrentUserId(): string {
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
}
