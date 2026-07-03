import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';

import { Drug } from '../../../../core/models/drug.model';
import { MedicineService } from '../../../../core/services/medicine.service';
import { DrugCardComponent } from '../../../shared/drug-card/drug-card.component';
import { SearchOverlayComponent } from '../../../shared/search-overlay/search-overlay.component';
import { AuthStateService } from '../../../../core/services/auth-state';
import { AuthRequiredModalComponent } from '../../../shared/components/auth-required-modal/auth-required-modal.component';
import { FavoriteService } from '../../../../core/services/favorite.service';
import { FavoriteStateService } from '../../../../core/services/favorite-state.service';

@Component({
  selector: 'app-featured-medicines',
  imports: [DrugCardComponent, SearchOverlayComponent, AuthRequiredModalComponent],
  templateUrl: './featured-medicines.component.html',
  styleUrl: './featured-medicines.component.css',
})
export class FeaturedMedicinesComponent implements OnInit {
  private medicineService = inject(MedicineService);
  private favoriteService = inject(FavoriteService);
  private favoriteState = inject(FavoriteStateService);
  @ViewChild('searchTrigger') searchTriggerRef!: ElementRef<HTMLButtonElement>;

  medicines = signal<Drug[]>([]);
  page = signal(1);
  hasMore = signal(true);
  loading = signal(true);
  loadingMore = signal(false);
  showAuthModal = signal(false);
  selectedDrug = signal<Drug | null>(null);
  showSearchOverlay = false;
  heroSearchRect: DOMRect | null = null;

  private readonly maxPages = 3;

  ngOnInit() {
    this.loadMedicines();
  }

  private authState = inject(AuthStateService);

  loadMedicines() {
    this.medicineService.getFeaturedMedicines(this.page()).subscribe({
      next: (res) => {
        this.medicines.update((current) => [...current, ...res.data]);
        this.hasMore.set(res.hasMore && this.page() < this.maxPages);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  loadMore() {
    if (!this.hasMore()) return;
    this.loadingMore.set(true);
    this.page.update((p) => p + 1);
    this.loadMedicines();
  }

  openSearch(): void {
    if (this.searchTriggerRef) {
      this.heroSearchRect = this.searchTriggerRef.nativeElement.getBoundingClientRect();
    }
    this.showSearchOverlay = true;
  }

  closeSearch(): void {
    this.showSearchOverlay = false;
    this.heroSearchRect = null;
  }

  onFavorite(drug: Drug) {
    if (!this.authState.isLoggedIn()) {
      this.selectedDrug.set(drug);
      this.showAuthModal.set(true);
      return;
    }

    this.toggleFavorite(drug);
  }

  toggleFavorite(drug: Drug) {
    const oldValue = drug.is_favorite;

    drug.is_favorite = !oldValue;

    this.favoriteService.toggle(drug.id).subscribe({
      next: (res) => {
        drug.is_favorite = res.isFavorite;

        // Keep the navbar (and anywhere else using FavoriteStateService) in sync instantly
        if (res.isFavorite) {
          this.favoriteState.addFavorite(drug);
        } else {
          this.favoriteState.removeFavorite(drug.id);
        }
      },

      error: (err) => {
        drug.is_favorite = oldValue;

        console.error(err);
      },
    });
  }

  onCardClick(drug: Drug) {
    console.log(drug);
  }
}