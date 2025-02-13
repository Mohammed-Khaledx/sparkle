import { Routes } from '@angular/router';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AdminComponent } from './auth/admin/admin.component';
import { authGuard } from './services/auth.guard';
import { FeedComponent } from './pages/feed/feed.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { NotificationComponent } from './components/notification/notification.component';
import { MessageComponent } from './components/message/message.component';
import { MembersComponent } from './pages/members/members.component';

export const routes: Routes = [
  { path: 'auth/signin', component: SigninComponent },
  { path: 'auth/signup', component: SignupComponent },
  {
    path: 'notifications',
    component: NotificationComponent,
    canActivate: [authGuard],
  },
  {
    path: 'members',
    component: MembersComponent,
    canActivate: [authGuard]
  },
  {
    path: 'messages',
    component: MessageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
  },
  {
    path: 'feed',
    component: FeedComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'members',
    component: MembersComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/auth/signin', pathMatch: 'full' },
  { path: '**', redirectTo: '/feed' },
];
