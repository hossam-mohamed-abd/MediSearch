import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, tap, forkJoin } from 'rxjs';

import { DrugCardComponent } from '../shared/drug-card/drug-card.component';
import { PharmacyService } from '../../core/services/pharmacy.service';

@Component({
  selector: 'app-pharmacy-details',
  standalone: true,
  imports: [ReactiveFormsModule, DrugCardComponent],
  templateUrl: './pharmacy-details.component.html',
  styleUrl: './pharmacy-details.component.css',
})
export class PharmacyDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pharmacyService = inject(PharmacyService);
  private cdr = inject(ChangeDetectorRef);

  pharmacyId = Number(this.route.snapshot.paramMap.get('id'));

  pharmacy = signal<any>(null);
  medicines = signal<any[]>([]);
  categories = signal<any[]>([]);
  reviews = signal<any[]>([]);

  hasMore = signal(false);
  page = signal(1);

  // ── حالة تحميل الصفحة كلها ──
  pageLoading = signal(true);
  pageError = signal(false);

  // ── حالات البحث ──
  searchFocused = signal(false);
  isSearching = signal(false);
  searchResultsReady = signal(true);

  searchControl = new FormControl('');
  categoryControl = new FormControl<number | null>(null);
  availableOnly = signal(false);

  ngOnInit() {
    this.loadInitialData();
    this.listenSearch();
    this.listenCategory();
  }

  /** تحميل كل بيانات الصفحة مرة واحدة، ومايتشالش اللودينج إلا لما الكل يجهز */
  private loadInitialData() {
    this.pageLoading.set(true);
    this.pageError.set(false);

    forkJoin({
      pharmacy: this.pharmacyService.getPharmacy(this.pharmacyId),
      categories: this.pharmacyService.getCategories(this.pharmacyId),
      reviews: this.pharmacyService.getReviews(this.pharmacyId),
      medicines: this.pharmacyService.getMedicines(this.pharmacyId, { page: 1 }),
    }).subscribe({
      next: ({ pharmacy, categories, reviews, medicines }) => {
        this.pharmacy.set(pharmacy.data);
        this.categories.set(categories.data);
        this.reviews.set(reviews.data);
        this.medicines.set(medicines.data);
        this.hasMore.set(medicines.hasMore);
        this.pageLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.pageLoading.set(false);
        this.pageError.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  // ── البحث ──
  onSearchFocus() {
    this.searchFocused.set(true);
    this.searchResultsReady.set(false);
    this.cdr.markForCheck();
  }

  onSearchBlur() {
    this.searchFocused.set(false);
    this.cdr.markForCheck();
  }

  private listenSearch() {
    this.searchControl.valueChanges
      .pipe(
        tap(() => {
          this.isSearching.set(true);
          this.searchResultsReady.set(false);
          this.cdr.markForCheck();
        }),
        debounceTime(3000),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.page.set(1);
        this.loadMedicines();
      });
  }

  private listenCategory() {
    this.categoryControl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadMedicines();
    });
  }

  loadMedicines() {
    this.pharmacyService
      .getMedicines(this.pharmacyId, {
        page: this.page(),
        search: this.searchControl.value ?? '',
        category: this.categoryControl.value,
        available: this.availableOnly(),
      })
      .subscribe({
        next: (res) => {
          if (this.page() === 1) {
            this.medicines.set(res.data);
          } else {
            this.medicines.update((old) => [...old, ...res.data]);
          }
          this.hasMore.set(res.hasMore);
          this.isSearching.set(false);
          this.searchResultsReady.set(true);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.isSearching.set(false);
          this.searchResultsReady.set(true);
          this.cdr.markForCheck();
        },
      });
  }

  loadMore() {
    this.page.update((value) => value + 1);
    this.loadMedicines();
  }

  toggleAvailable() {
    this.availableOnly.update((value) => !value);
    this.page.set(1);
    this.loadMedicines();
  }

  trackById(index: number, item: any) {
    return item.id;
  }
}
