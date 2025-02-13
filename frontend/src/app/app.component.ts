import { LayoutComponent } from './components/layout/layout.component';
import { Component, inject } from '@angular/core';
import { AuthLayoutComponent } from './auth/auth-layout/auth-layout.component';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent, AuthLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private router = inject(Router);

  authLayout: boolean = false;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.authLayout = event.urlAfterRedirects.includes('/auth/');
      });
  }
}
