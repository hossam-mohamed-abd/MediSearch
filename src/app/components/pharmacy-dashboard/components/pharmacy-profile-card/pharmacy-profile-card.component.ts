import {
    Component,
    OnInit,
    inject,
    signal,
  } from '@angular/core';
  
  import { CommonModule } from '@angular/common';
  
  import { PharmacyDashboardService }
  from '../../../../core/services/pharmacy-dashboard.service';
  
  @Component({
    selector: 'app-pharmacy-profile-card',
    standalone: true,
    imports: [
      CommonModule,
    ],
    templateUrl: './pharmacy-profile-card.component.html',
    styleUrl: './pharmacy-profile-card.component.css',
  })
  export class PharmacyProfileCardComponent
  implements OnInit {
  
    private service =
      inject(
        PharmacyDashboardService,
      );
  
    profile =
      signal<any>(null);
  
    loading =
      signal(true);
  
    ngOnInit() {
  
      this.load();
  
    }
  
    load() {
  
      this.loading.set(true);
  
      this.service
        .getProfile()
        .subscribe({
  
          next: (res) => {
  
            this.profile.set(
              res.data,
            );
  
            this.loading.set(false);
  
          },
  
          error: () => {
  
            this.loading.set(false);
  
          },
  
        });
  
    }
  
  }