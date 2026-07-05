import { Component, OnInit, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { AuthStateService } from '../../../core/services/auth-state';
import { SearchOverlayComponent } from '../search-overlay/search-overlay.component';
import { FavoriteService } from '../../../core/services/favorite.service';
import { AuthRequiredModalComponent } from '../components/auth-required-modal/auth-required-modal.component';
import { FavoriteStateService } from '../../../core/services/favorite-state.service';
import { NotificationStateService } from '../../../core/services/notification-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    SearchOverlayComponent,
    AuthRequiredModalComponent,
    DatePipe,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private authState = inject(AuthStateService);
  private favoriteService = inject(FavoriteService);
  private favoriteState = inject(FavoriteStateService);
  private notificationService = inject(NotificationService);
  private notificationState = inject(NotificationStateService);
  private pharmacyService = inject(PharmacyService);
  private categoryService = inject(CategoryService);

  @ViewChild('navSearchBox') navSearchBoxRef!: ElementRef<HTMLDivElement>;

  favoriteCount = this.favoriteState.favoriteCount;
  favorites = this.favoriteState.favorites;
  notificationCount = this.notificationState.notificationCount;
  notifications = this.notificationState.notifications;

  isScrolled = false;
  isMenuOpen = false;
  isProfileOpen = false;
  isFavoritesOpen = false;
  isNotificationsOpen = false;
  isPharmaciesDropdownOpen = false;
  isCategoriesDropdownOpen = false;

  currentUrl = '';
  isLoggedIn = false;
  user: any = null;
  showSearchOverlay = false;
  heroSearchRect: DOMRect | null = null;
  showAuthModal = false;

  previewPharmacies: any[] = [];
  pharmaciesLoading = false;
  pharmaciesLoaded = false;

  previewCategories: any[] = [];
  categoriesLoading = false;
  categoriesLoaded = false;

  private pharmaciesHoverTimer: any;
  private categoriesHoverTimer: any;

  ngOnInit() {
    this.currentUrl = this.router.url;

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.currentUrl = this.router.url;
      this.isMenuOpen = false;
      this.isProfileOpen = false;
      this.showSearchOverlay = false;
      this.closePharmaciesDropdown();
      this.closeCategoriesDropdown();
    });

    this.authState.user$.subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!user;
      if (user) {
        this.loadFavorites();
        this.loadNotifications();
      } else {
        this.favoriteState.clear();
        this.notificationState.clear();
      }
    });

    this.refreshProfile();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-wrapper')) this.isProfileOpen = false;
    if (!target.closest('.favorites-wrapper')) this.isFavoritesOpen = false;
    if (!target.closest('.notif-wrapper')) this.isNotificationsOpen = false;
    if (!target.closest('.nav-item-dropdown')) {
      this.isPharmaciesDropdownOpen = false;
      this.isCategoriesDropdownOpen = false;
    }
  }

  // ── Scroll to section ────────────────────────────────────────────────────

  scrollToSection(sectionId: string): void {
    if (this.router.url !== '/') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.doScroll(sectionId), 300);
      });
    } else {
      this.doScroll(sectionId);
    }
  }

  private doScroll(sectionId: string): void {
    const el = document.querySelector(`.${sectionId}, #${sectionId}, app-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── Pharmacies dropdown ───────────────────────────────────────────────────

  onPharmaciesHover(): void {
    this.isPharmaciesDropdownOpen = true;
    this.isCategoriesDropdownOpen = false;
    if (!this.pharmaciesLoaded) this.loadPreviewPharmacies();
  }

  closePharmaciesDropdown(): void {
    this.isPharmaciesDropdownOpen = false;
  }

  private loadPreviewPharmacies(): void {
    if (this.pharmaciesLoading) return;
    this.pharmaciesLoading = true;

    this.pharmacyService.getPharmacies(1).subscribe({
      next: (res) => {
        this.previewPharmacies = (res.data || []).slice(0, 4);
        this.pharmaciesLoaded = true;
        this.pharmaciesLoading = false;
      },
      error: () => {
        this.pharmaciesLoading = false;
      },
    });
  }

  // ── Categories dropdown ───────────────────────────────────────────────────

  onCategoriesHover(): void {
    this.isCategoriesDropdownOpen = true;
    this.isPharmaciesDropdownOpen = false;
    if (!this.categoriesLoaded) this.loadPreviewCategories();
  }

  closeCategoriesDropdown(): void {
    this.isCategoriesDropdownOpen = false;
  }

  private loadPreviewCategories(): void {
    if (this.categoriesLoading) return;
    this.categoriesLoading = true;

    this.categoryService.getHomeCategories().subscribe({
      next: (res) => {
        this.previewCategories = (res.data || []).slice(0, 4);
        this.categoriesLoaded = true;
        this.categoriesLoading = false;
      },
      error: () => {
        this.categoriesLoading = false;
      },
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────

  openSearch(): void {
    if (this.navSearchBoxRef) {
      this.heroSearchRect = this.navSearchBoxRef.nativeElement.getBoundingClientRect();
    }
    this.showSearchOverlay = true;
    this.isMenuOpen = false;
  }

  closeSearch(): void {
    this.showSearchOverlay = false;
    this.heroSearchRect = null;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.isProfileOpen = false;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  private refreshProfile(): void {
    this.authService.profile().subscribe({
      next: (res: any) => this.authState.setUser(res.user),
      error: (err) => {
        if (err.status === 401) this.authState.clearUser();
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authState.clearUser();
        this.favoriteState.clear();
        this.notificationState.clear();
        this.isFavoritesOpen = false;
        this.isNotificationsOpen = false;
        this.isProfileOpen = false;
        this.router.navigate(['/login']);
      },
    });
  }

  // ── Favorites ─────────────────────────────────────────────────────────────

  private loadFavorites(): void {
    if (!this.isLoggedIn) return;
    this.favoriteService.getFavorites().subscribe({
      next: (res: any) => this.favoriteState.setFavorites(res.data),
    });
  }

  toggleFavorites(): void {
    if (!this.isLoggedIn) {
      this.showAuthModal = true;
      return;
    }
    this.isFavoritesOpen = !this.isFavoritesOpen;
    this.isNotificationsOpen = false;
    this.isProfileOpen = false;
  }

  toggleProfileMenu(): void {
    this.isProfileOpen = !this.isProfileOpen;
    this.isFavoritesOpen = false;
  }

  onRemoveFavorite(drugId: number, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.favoriteService.toggle(drugId).subscribe({
      next: () => this.favoriteState.removeFavorite(drugId),
      error: (err) => console.error(err),
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  toggleNotifications(): void {
    if (!this.isLoggedIn) {
      this.showAuthModal = true;
      return;
    }
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isFavoritesOpen = false;
    this.isProfileOpen = false;
  }

  private loadNotifications(): void {
    if (!this.isLoggedIn) return;
    this.notificationService.getNotifications().subscribe({
      next: (res) => this.notificationState.setNotifications(res.data),
    });
  }

  deleteNotification(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe({
      next: () => this.notificationState.removeNotification(id),
    });
  }

  deleteAllNotifications(): void {
    this.notificationService.deleteAll().subscribe({
      next: () => this.notificationState.clear(),
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.notificationState.markAllAsRead(),
    });
  }
}
