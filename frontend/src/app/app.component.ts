import { Component, inject, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private router = inject(Router);

  // Compute if sidebar should be shown
  showSidebar = computed(() => {
    const currentRoute = this.router.url;
    const authRoutes = ['/signin', '/signup'];
    return !authRoutes.includes(currentRoute);
  });

  // Compute main content class
  mainContentClass = computed(() => ({
    'main-content': true,
    'with-sidebar': this.showSidebar(),
    'full-width': !this.showSidebar()
  }));
}
