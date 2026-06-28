import { Component, OnInit, inject, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStateService } from '../../../core/services/auth-state';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router      = inject(Router);
  private authState   = inject(AuthStateService);

  isScrolled    = false;
  isMenuOpen    = false;
  isProfileOpen = false;
  currentUrl    = '';
  isLoggedIn    = false;
  user: any     = null;

  ngOnInit() {
    this.currentUrl = this.router.url;

    // نغلق الـ menus عند تغيير الـ route
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl    = this.router.url;
        this.isMenuOpen    = false;
        this.isProfileOpen = false;
      });

    // subscribe — بيشتغل فوراً بالـ cached value من localStorage
    this.authState.user$.subscribe((user) => {
      this.user      = user;
      this.isLoggedIn = !!user;
    });

    // refresh في الخلفية بدون ما يأثر على الـ UI
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
  }

  toggleMenu() {
    this.isMenuOpen    = !this.isMenuOpen;
    this.isProfileOpen = false;
  }

  toggleProfileMenu() {
    this.isProfileOpen = !this.isProfileOpen;
  }

  private refreshProfile() {
    this.authService.profile().subscribe({
      next: (res: any) => this.authState.setUser(res.user),
      error: ()        => this.authState.clearUser(),
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.authState.clearUser();
        this.router.navigate(['/login']);
      },
    });
  }
}