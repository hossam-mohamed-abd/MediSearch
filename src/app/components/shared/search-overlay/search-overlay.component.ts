import {
  Component,
  Output,
  Input,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { Router } from '@angular/router';

import { DrugCardComponent, Drug } from '../drug-card/drug-card.component';
import { SearchService } from '../../../core/services/search.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { FavoriteStateService } from '../../../core/services/favorite-state.service';
import { AuthStateService } from '../../../core/services/auth-state';

type SearchStatus = 'idle' | 'typing' | 'loading' | 'done';

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [ReactiveFormsModule, DrugCardComponent],
  templateUrl: './search-overlay.component.html',
  styleUrl: './search-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchOverlayComponent implements OnInit, AfterViewInit, OnDestroy {
  private searchService = inject(SearchService);
  private favoriteService = inject(FavoriteService);
  private favoriteState = inject(FavoriteStateService);
  private authState = inject(AuthStateService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  /** Time to wait after the user stops typing before searching automatically */
  private readonly SEARCH_DEBOUNCE_MS = 1000;
  /** How long the "done" checkmark stays visible before reverting to idle */
  private readonly DONE_DISPLAY_MS = 700;
  /** Minimum characters required to trigger a search */
  private readonly MIN_QUERY_LENGTH = 3;

  @Input()
  heroSearchRect: DOMRect | null = null;

  @Output()
  closed = new EventEmitter<void>();

  @ViewChild('overlaySearchRef')
  overlaySearchRef!: ElementRef<HTMLDivElement>;

  @ViewChild('searchInput')
  searchInputRef!: ElementRef<HTMLInputElement>;

  searchControl = new FormControl('');

  drugs: Drug[] = [];

  page = 1;
  limit = 6;
  total = 0;
  hasMore = false;

  isVisible = false;
  isAnimating = false;

  isLoggedIn = false;
  searchStatus: SearchStatus = 'idle';

  /** true once the user paused typing with 1-2 characters only */
  showTooShortHint = false;

  recentSearches: string[] = [];

  readonly popularSearches = ['Panadol', 'Augmentin', 'Brufen', 'Glucophage', 'Concor', 'Ventolin'];

  private doneTimer?: ReturnType<typeof setTimeout>;

  private keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  ngOnInit(): void {
    this.isLoggedIn = this.authState.isLoggedIn();

    this.authState.user$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.cdr.markForCheck();
    });

    this.loadRecentSearches();
    this.listenSearch();

    document.addEventListener('keydown', this.keydownHandler);
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    this.playFLIP();
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    document.body.style.overflow = '';
    if (this.doneTimer) clearTimeout(this.doneTimer);
  }

  private listenSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        tap((value) => {
          const query = (value ?? '').trim();

          // Hide any stale "too short" hint the moment the user resumes typing
          this.showTooShortHint = false;

          if (query.length >= this.MIN_QUERY_LENGTH) {
            this.searchStatus = 'typing';
          } else {
            this.searchStatus = 'idle';
            this.drugs = [];
            this.total = 0;
            this.hasMore = false;
          }
          this.cdr.markForCheck();
        }),
        debounceTime(this.SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
      )
      .subscribe((value) => {
        const query = (value ?? '').trim();

        if (query.length === 0) {
          this.showTooShortHint = false;
          this.cdr.markForCheck();
          return;
        }

        if (query.length < this.MIN_QUERY_LENGTH) {
          this.showTooShortHint = true;
          this.cdr.markForCheck();
          return;
        }

        this.showTooShortHint = false;
        this.page = 1;
        this.search(query);
      });
  }

  search(query: string): void {
    this.searchStatus = 'loading';
    this.cdr.markForCheck();

    this.searchService.search(query, this.page, this.limit).subscribe({
      next: (res) => {
        this.drugs = res.data;
        this.total = res.total;
        this.hasMore = res.hasMore;
        this.saveSearch(query);
        this.showDone();
      },
      error: () => {
        this.drugs = [];
        this.total = 0;
        this.hasMore = false;
        this.searchStatus = 'idle';
        this.cdr.markForCheck();
      },
    });
  }

  private showDone(): void {
    this.searchStatus = 'done';
    this.cdr.markForCheck();

    if (this.doneTimer) clearTimeout(this.doneTimer);
    this.doneTimer = setTimeout(() => {
      this.searchStatus = 'idle';
      this.cdr.markForCheck();
    }, this.DONE_DISPLAY_MS);
  }

  loadMore(): void {
    if (!this.hasMore) return;

    this.page++;
    this.searchStatus = 'loading';
    this.cdr.markForCheck();

    this.searchService.search(this.searchControl.value ?? '', this.page, this.limit).subscribe({
      next: (res) => {
        this.drugs = [...this.drugs, ...res.data];
        this.hasMore = res.hasMore;
        this.showDone();
      },
    });
  }

  searchFromTag(query: string): void {
    if (!this.isLoggedIn) return;
    this.showTooShortHint = false;
    this.searchControl.setValue(query);
  }

  private loadRecentSearches(): void {
    const data = localStorage.getItem('recent-searches');
    if (!data) return;
    this.recentSearches = JSON.parse(data);
  }

  private saveSearch(query: string): void {
    let history = this.recentSearches.filter((item) => item !== query);
    history.unshift(query);
    history = history.slice(0, 6);
    this.recentSearches = history;
    localStorage.setItem('recent-searches', JSON.stringify(history));
  }

  clearRecentSearches(): void {
    this.recentSearches = [];
    localStorage.removeItem('recent-searches');
  }

  onDrugClick(drug: Drug): void {
    this.close();
    this.router.navigate(['/medicine', drug.id]);
  }

  onFavoriteToggle(drug: Drug): void {
    if (!this.isLoggedIn) return;

    this.favoriteService.toggle(drug.id).subscribe({
      next: (res) => {
        drug.is_favorite = res.isFavorite;

        if (res.isFavorite) {
          this.favoriteState.addFavorite(drug);
        } else {
          this.favoriteState.removeFavorite(drug.id);
        }

        this.cdr.markForCheck();
      },
    });
  }

  /**
   * TODO: نربط الزرار ده بالـ AI model بعدين.
   * دلوقتي بس بنجهز الـ query الحالي عشان نبعته للموديل لما يبقى جاهز.
   */
  askAI(): void {
    const query = this.searchControl.value?.trim();
    if (!query) return;

    console.log('Ask AI about:', query);
  }

  goToRegister(): void {
    this.close();
    this.router.navigate(['/register']);
  }

  goToLogin(): void {
    this.close();
    this.router.navigate(['/login']);
  }

  continueAsGuest(): void {
    this.close();
  }

  private playFLIP(): void {
    if (!this.heroSearchRect || !this.overlaySearchRef) {
      this.isVisible = true;
      this.cdr.markForCheck();
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 300);
      return;
    }

    const target = this.overlaySearchRef.nativeElement;
    const targetRect = target.getBoundingClientRect();

    const dx = this.heroSearchRect.left - targetRect.left;
    const dy = this.heroSearchRect.top - targetRect.top;
    const scaleX = this.heroSearchRect.width / targetRect.width;
    const scaleY = this.heroSearchRect.height / targetRect.height;

    target.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    target.style.transformOrigin = 'top left';
    target.style.transition = 'none';
    target.style.opacity = '1';

    this.isAnimating = true;
    this.isVisible = false;
    this.cdr.markForCheck();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.style.transition = 'transform .55s cubic-bezier(.34,1.15,.64,1),opacity .3s';
        target.style.transform = 'translate(0,0) scale(1)';

        setTimeout(() => {
          this.isVisible = true;
          this.isAnimating = false;
          this.cdr.markForCheck();
          if (this.isLoggedIn) this.searchInputRef?.nativeElement.focus();
        }, 200);
      });
    });
  }

  close(): void {
    this.isVisible = false;
    this.cdr.markForCheck();

    if (this.heroSearchRect && this.overlaySearchRef) {
      const target = this.overlaySearchRef.nativeElement;
      const targetRect = target.getBoundingClientRect();

      const dx = this.heroSearchRect.left - targetRect.left;
      const dy = this.heroSearchRect.top - targetRect.top;
      const scaleX = this.heroSearchRect.width / targetRect.width;
      const scaleY = this.heroSearchRect.height / targetRect.height;

      target.style.transition = 'transform .45s cubic-bezier(.25,.46,.45,.94),opacity .3s';
      target.style.transform = `translate(${dx}px,${dy}px) scale(${scaleX},${scaleY})`;
      target.style.opacity = '0';

      setTimeout(() => this.closed.emit(), 460);
    } else {
      setTimeout(() => this.closed.emit(), 300);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('search-overlay__backdrop')) {
      this.close();
    }
  }

  onSearchButton(): void {
    if (!this.isLoggedIn) return;

    const query = this.searchControl.value?.trim();
    if (!query) return;

    this.router.navigate(['/search'], { queryParams: { q: query } });
    this.close();
  }

  onEnter(): void {
    this.onSearchButton();
  }

  trackDrug(index: number, drug: Drug) {
    return drug.id;
  }
}
