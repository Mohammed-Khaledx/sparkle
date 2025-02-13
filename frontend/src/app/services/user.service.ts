import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';
import { environment } from '../../environments/environment';
import { Follows } from '../interfaces/follows';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 12) {
    return this.http.get<{ users: User[], totalPages: number }>(
      `${this.apiUrl}?page=${page}&limit=${limit}`
    );
  }

  toggleFollow(userId: string, currentStatus: boolean) {
    const action = currentStatus ? 'unfollow' : 'follow';
    return this.http.post(
      `${environment.apiUrl}/followOrUnfollow/${userId}/${action}`,
      {},
    );
  }

  getLoggedUserFollowing(): Observable<Follows[]> {
    return this.http.get<Follows[]>(environment.apiUrl + '/users/following');
  }
}
