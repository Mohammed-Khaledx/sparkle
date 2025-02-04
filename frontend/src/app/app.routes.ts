import { Routes } from '@angular/router';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AdminComponent } from './auth/admin/admin.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'signin', component: SigninComponent },
  { path: 'signup', component: SignupComponent },

  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/signin', pathMatch: 'full' },
];
