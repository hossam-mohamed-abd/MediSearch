import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';

import { RegisterComponent } from './features/auth/pages/register/register.component';

import { Login } from './features/auth/pages/login/login.component';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },

  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
  },

  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
  },

  {
    path: '**',
    redirectTo: '',
  },
];
