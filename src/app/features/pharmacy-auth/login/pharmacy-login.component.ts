import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PharmacyAuthService } from '../../../core/services/pharmacy-auth.service';
import { AuthStateService } from '../../../core/services/auth-state';

@Component({
  selector: 'app-pharmacy-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})

export class PharmacyLoginComponent {
  private fb = inject(FormBuilder);

  private pharmacyAuth =
    inject(PharmacyAuthService);

  private router =
    inject(Router);

  private authState =
    inject(AuthStateService);

  isLoading = false;

  errorMessage = '';

  showPass = false;

  emailFocused = false;

  passFocused = false;

  loginForm = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
      ],
    ],
  });

  login() {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.errorMessage = '';

    this.pharmacyAuth
      .login(this.loginForm.getRawValue())
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;

          this.authState.setUser(res.user);

          this.router.navigate([
            '/pharmacy/dashboard',
          ]);
        },

        error: (err) => {
          this.isLoading = false;

          this.errorMessage =
            err.error?.message ??
            'Invalid Email Or Password';

          this.loginForm
            .get('email')
            ?.setErrors({
              server: true,
            });

          this.loginForm
            .get('password')
            ?.setErrors({
              server: true,
            });
        },
      });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}