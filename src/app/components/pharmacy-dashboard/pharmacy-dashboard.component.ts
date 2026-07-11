import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { PharmacyAuthService } from '../../core/services/pharmacy-auth.service';
import { UploadCardComponent } from './components/upload-card/upload-card.component';
import { PharmacyProfileCardComponent } from './components/pharmacy-profile-card/pharmacy-profile-card.component';

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    UploadCardComponent,
    PharmacyProfileCardComponent
  ],
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrl: './pharmacy-dashboard.component.css',
})
export class PharmacyDashboardComponent
  implements OnInit {

  private pharmacyAuth =
    inject(PharmacyAuthService);

  private router =
    inject(Router);

  loading =
    signal<any>(null);

  error =
    signal<any>(null);

    dashboard = signal<any>(null);

  ngOnInit() {
    this.loadDashboard();
  }
  loadDashboard() {

    this.loading.set(true);

    this.pharmacyAuth
      .getDashboard()
      .subscribe({

        next: (res: any) => {

          this.dashboard.set(res.data);

          this.loading.set(false);

        },

        error: (err) => {

          console.log(err);

          this.error.set(true);

          this.loading.set(false);

        },

      });

  }
  logout() {

    this.pharmacyAuth
      .logout()
      .subscribe(() => {

        this.router.navigate([
          '/pharmacy/login',
        ]);

      });

  }

}