import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';

import { RegisterComponent } from './features/auth/pages/register/register.component';
import { Login } from './features/auth/pages/login/login.component';

import { PharmacyLoginComponent } from './features/pharmacy-auth/login/pharmacy-login.component';
import { guestGuard } from './core/guards/guest-guard';
import { pharmacyAuthGuard } from './core/guards/pharmacy-auth.guard';
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },

  // ==========================
  // Customer Authentication
  // ==========================

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

  // ==========================
  // Pharmacy Authentication
  // ==========================

  {
    path: 'pharmacy/login',
    component: PharmacyLoginComponent,
  },

  {
    path: 'pharmacy/dashboard',

    canActivate: [pharmacyAuthGuard],

    loadComponent: () =>
      import('./components/pharmacy-dashboard/pharmacy-dashboard.component').then(
        (m) => m.PharmacyDashboardComponent,
      ),
  },

  // ==========================
  // Pharmacy Details
  // ==========================

  {
    path: 'pharmacies/:id',
    loadComponent: () =>
      import('./components/pharmacy-details/pharmacy-details.component').then(
        (m) => m.PharmacyDetailsComponent,
      ),
  },

  // ==========================
  // Medicine Details
  // ==========================

  {
    path: 'drugs/:id',
    loadComponent: () =>
      import(
        './components/shared/medicine-detail/medicine-detail.component'
      ).then((m) => m.MedicineDetailComponent),
  },

  // ==========================
  // 404
  // ==========================

  {
    path: '**',
    redirectTo: '',
  },
];