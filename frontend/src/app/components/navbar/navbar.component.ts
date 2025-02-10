import { Component, signal, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  authService = inject(AuthService);
  isLoggedIn = signal(false);

  ngOnInit() {
    this.isLoggedIn.set(this.authService.isAuthenticated());

    this.authService.isAuthenticated$.subscribe((authState) => {
      this.isLoggedIn.set(authState);
    });
  }
  logout() {
    this.authService.logout();
  }

  
}
