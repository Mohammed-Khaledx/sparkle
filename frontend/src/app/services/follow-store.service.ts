import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface User {
  _id: string;
  name: string;
  profilePicture?: { url: string };
}

@Injectable({ providedIn: 'root' })
export class FollowStoreService {
  // Signals to hold the state
  followers = signal<User[]>([]);
  following = signal<User[]>([]);
  followStatus = signal<Map<string, boolean>>(new Map());

   constructor(private http: HttpClient) {}

  loadFollowers(userId: string): void {
    if (!userId) return;
    this.http.get<{ data: any[] }>(`http://localhost:3000/followOrUnfollow/${userId}?type=followers`)
      .subscribe({
        next: (response) => {
          const followers = response.data.map(f => f.follower);
          this.followers.set(followers);
          // Optionally, check follow status for each follower if needed
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
          // Mark these users as followed in the followStatus map
          following.forEach(user => this.updateFollowStatus(user._id, true));
        },
        error: (err) => {
          console.error('Error loading following:', err);
          this.following.set([]);
        }
      });
  }

  toggleFollow(userId: string, currentStatus: boolean) {
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
}
