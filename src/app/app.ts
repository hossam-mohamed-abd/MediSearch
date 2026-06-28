import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { Component, inject, OnInit, signal } from '@angular/core';

import { AuthService } from './core/services/auth.service';

import { AuthStateService } from './core/services/auth-state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('TheSilence_DEPI_project_web_front');

  private authService = inject(AuthService);

  private authState = inject(AuthStateService);

  ngOnInit() {
    this.authService.profile().subscribe({
      next: (res: any) => {
        this.authState.setUser(res.user);
      },

      error: () => {
        this.authState.clearUser();
      },
    });
  }
}
