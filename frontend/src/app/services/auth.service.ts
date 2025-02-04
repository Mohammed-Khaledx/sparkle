import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}
  baseUrl = 'http://localhost:3000/users';
  httpClient = inject(HttpClient);

  signup(data: any) {
    return this.httpClient.post(`${this.baseUrl}/register`, data);
  }

  login(data: any) {
    return this.httpClient.post(`${this.baseUrl}/login`, data).pipe(
      tap((result) => {
        localStorage.setItem('authUser', JSON.stringify(result));
      })
    );
  }


  logout() {
    localStorage.removeItem('authUser');
  }

  isLoggedIn() {
    return localStorage.getItem('authUser') !== null;
  }
}
