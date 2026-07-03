import {
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { AuthRoutingModule } from "../../../../features/auth/auth-routing-module";
@Component({
  selector: 'app-featured-pharmacies',
  imports: [AuthRoutingModule],
  templateUrl: './featured-pharmacies.component.html',
  styleUrl: './featured-pharmacies.component.css',
})
export class PharmaciesSectionComponent
  implements OnInit {

  private pharmacyService =
    inject(PharmacyService);

  pharmacies: any[] = [];

  page = 1;

  loading = false;

  hasMore = true;

  ngOnInit() {
    this.loadPharmacies();
  }

  loadPharmacies() {

    if (
      this.loading ||
      !this.hasMore
    ) {
      return;
    }

    this.loading = true;

    this.pharmacyService
      .getPharmacies(this.page)
      .subscribe({
        next: (res) => {

          const data =
            res.data;

          this.pharmacies = [
            ...this.pharmacies,
            ...data,
          ];

          if (data.length < 4) {
            this.hasMore =
              false;
          }

          this.page++;

          this.loading = false;
        },

        error: () => {
          this.loading = false;
        },
      });
  }

  onCardClick(
    pharmacy: any
  ) {
    console.log(pharmacy);
  }
}