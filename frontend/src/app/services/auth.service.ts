import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}
  baseUrl = 'http://localhost:3000/users';

  router = inject(Router);
  httpClient = inject(HttpClient);

  // set
  private authState = new BehaviorSubject<boolean>(
    // Check if token exists
    !!localStorage.getItem('token'),
  );
  isAuthenticated$ = this.authState.asObservable(); // Expose as observable

  // note that the signup doesnot set the token
  // and the token is set in the login method
  signup(data: any) {
    return this.httpClient.post(`${this.baseUrl}/register`, data);
  }

  login(data: any) {
    return this.httpClient
      .post<{ token: string }>(`${this.baseUrl}/login`, data)
      .pipe(
        tap((result) => {
          this.authState.next(true);
          localStorage.setItem('token', result.token);
        }),
      );
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/signin']); // Redirect to login after logout
    this.authState.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  isLoggedIn() {
    return localStorage.getItem('token') !== null;
  }
}
