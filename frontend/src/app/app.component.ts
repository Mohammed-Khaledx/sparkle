import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
// import { ExploreComponent } from "./components/explore/explore.component";
// import { HomePageComponent } from './components/home-page/home-page.component';
// import { MassegesComponent } from './components/masseges/masseges.component';
// import { NavComponent } from './components/nav/nav.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
