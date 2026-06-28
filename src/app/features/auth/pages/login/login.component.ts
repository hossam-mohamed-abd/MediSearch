// login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStateService } from '../../../../core/services/auth-state';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class Login {
  private fb        = inject(FormBuilder);
  private authService = inject(AuthService);
  private router    = inject(Router);
  private authState = inject(AuthStateService);

  isLoading    = false;
  errorMessage = '';
  showPass     = false;

  emailFocused = false;
  passFocused  = false;

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  login() {
    // Mark all touched so validation messages show immediately
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) return;

    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.authState.setUser(res.user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading   = false;
        this.errorMessage = err.error?.message || 'Invalid email or password';

        // Mark both fields as invalid so the red border appears instantly
        this.loginForm.get('email')?.setErrors({ serverError: true });
        this.loginForm.get('password')?.setErrors({ serverError: true });
      },
    });
  }

  get email()    { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}