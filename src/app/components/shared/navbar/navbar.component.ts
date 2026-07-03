import { Component, OnInit, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStateService } from '../../../core/services/auth-state';
import { SearchOverlayComponent } from '../search-overlay/search-overlay.component';
import { FavoriteService } from '../../../core/services/favorite.service';
import { AuthRequiredModalComponent } from '../components/auth-required-modal/auth-required-modal.component';
import { FavoriteStateService } from '../../../core/services/favorite-state.service';
import { NotificationStateService } from '../../../core/services/notification-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DatePipe } from '@angular/common';

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
  @ViewChild('navSearchBox') navSearchBoxRef!: ElementRef<HTMLDivElement>;

  favoriteCount = this.favoriteState.favoriteCount;
  favorites = this.favoriteState.favorites;

  isScrolled = false;
  isMenuOpen = false;
  isProfileOpen = false;
  currentUrl = '';
  isLoggedIn = false;
  user: any = null;
  showSearchOverlay = false;
  heroSearchRect: DOMRect | null = null;
  showAuthModal = false;
  isNotificationsOpen = false;
  isFavoritesOpen = false;
  notificationCount = this.notificationState.notificationCount;

  notifications = this.notificationState.notifications;
  ngOnInit() {
    this.currentUrl = this.router.url;

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.currentUrl = this.router.url;
      this.isMenuOpen = false;
      this.isProfileOpen = false;
      this.showSearchOverlay = false;
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
    if (!target.closest('.profile-wrapper')) {
      this.isProfileOpen = false;
    }
    if (!target.closest('.favorites-wrapper')) {
      this.isFavoritesOpen = false;
    }
    if (!target.closest('.notif-wrapper')) {
      this.isNotificationsOpen = false;
    }
  }

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

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.isProfileOpen = false;
  }

  private refreshProfile() {
    this.authService.profile().subscribe({
      next: (res: any) => {
        this.authState.setUser(res.user);
      },
      error: (err) => {
        if (err.status === 401) {
          this.authState.clearUser();
        }
      },
    });
  }

  logout() {
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

  private loadFavorites() {
    if (!this.isLoggedIn) return;

    this.favoriteService.getFavorites().subscribe({
      next: (res: any) => {
        this.favoriteState.setFavorites(res.data);
      },
    });
  }

  toggleFavorites() {
    if (!this.isLoggedIn) {
      this.showAuthModal = true;
      return;
    }

    this.isFavoritesOpen = !this.isFavoritesOpen;

    this.isNotificationsOpen = false;
    this.isProfileOpen = false;
  }
  toggleProfileMenu() {
    this.isProfileOpen = !this.isProfileOpen;
    this.isFavoritesOpen = false;
  }
  onRemoveFavorite(drugId: number, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    this.favoriteService.toggle(drugId).subscribe({
      next: () => {
        this.favoriteState.removeFavorite(drugId);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  toggleNotifications() {
    if (!this.isLoggedIn) {
      this.showAuthModal = true;
      return;
    }

    this.isNotificationsOpen = !this.isNotificationsOpen;

    this.isFavoritesOpen = false;
    this.isProfileOpen = false;
  }
  private loadNotifications() {
    if (!this.isLoggedIn) {
      return;
    }

    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notificationState.setNotifications(res.data);
      },
    });
  }

  deleteNotification(id: number, event: MouseEvent) {
    event.stopPropagation();

    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notificationState.removeNotification(id);
      },
    });
  }

  deleteAllNotifications() {
    this.notificationService.deleteAll().subscribe({
      next: () => {
        this.notificationState.clear();
      },
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notificationState.markAllAsRead();
      },
    });
  }
}
