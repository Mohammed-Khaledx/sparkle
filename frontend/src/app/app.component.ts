import { Component , inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

// import { ExploreComponent } from "./components/explore/explore.component";
// import { HomePageComponent } from './components/home-page/home-page.component';
// import { MassegesComponent } from './components/masseges/masseges.component';
// import { NavComponent } from './components/nav/nav.component';
@Component({
  selector: 'app-root',
  standalone : true,
  imports: [RouterOutlet, NavbarComponent ,SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  private router = inject(Router);

  showSidebar(): boolean {
    const currentRoute = this.router.url;
    return !['/signin', '/signup'].includes(currentRoute);
  }
}
