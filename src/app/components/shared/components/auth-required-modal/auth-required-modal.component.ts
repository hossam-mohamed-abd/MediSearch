import {
  Component,
  EventEmitter,
  Output,
  inject
} from '@angular/core';

import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-required-modal',
  standalone: true,
  imports: [],
  templateUrl: './auth-required-modal.component.html',
  styleUrl: './auth-required-modal.component.css'
})
export class AuthRequiredModalComponent {

  private router = inject(Router);

  @Output()
  close = new EventEmitter<void>();

  goToLogin() {
    this.router.navigate(['/login']);
  }

  closeModal() {
    this.close.emit();
  }
}