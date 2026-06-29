import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pass    = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (confirm && pass !== confirm) {
    control.get('confirmPassword')?.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  if (confirm && pass === confirm) {
    const errs = { ...control.get('confirmPassword')?.errors };
    delete errs['mismatch'];
    control.get('confirmPassword')?.setErrors(Object.keys(errs).length ? errs : null);
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);
  private ngZone      = inject(NgZone);

  countries:    any[] = [];
  governorates: any[] = [];
  cities:       any[] = [];

  isLoading      = false;
  showPass       = false;
  formSubmitted  = false;
  emailExists    = false;
  emailChecking  = false;

  toast: { message: string; type: 'error' | 'success' } | null = null;
  toastProgress = 100;
  private toastTimer:    ReturnType<typeof setTimeout>  | null = null;
  private toastInterval: ReturnType<typeof setInterval> | null = null;

  private governoratesCache = new Map<number, any[]>();
  private citiesCache       = new Map<number, any[]>();

  registerForm = this.fb.group({
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    phone:           ['', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    countryId:       [''],
    governorateId:   [{ value: '', disabled: true }],
    cityId:          [{ value: '', disabled: true }],
  }, { validators: passwordsMatch });

  ngOnInit()    { this.loadCountries(); }
  ngOnDestroy() { this.clearToastTimers(); }

  // ── Validation helpers ───────────────────────────────────
  showError(field: string): boolean {
    if (!this.formSubmitted) return false;
    return !!this.registerForm.get(field)?.invalid;
  }

  showMismatch(): boolean {
    if (!this.formSubmitted) return false;
    return !!this.registerForm.get('confirmPassword')?.errors?.['mismatch'];
  }

  // ── Email blur check ─────────────────────────────────────
  onEmailBlur() {
    const ctrl = this.registerForm.get('email');
    if (!ctrl || ctrl.invalid) return;

    const email = ctrl.value?.trim();
    if (!email) return;

    this.emailExists   = false;
    this.emailChecking = true;

    this.authService.checkEmail(email).subscribe({
      next: (res: any) => {
        this.emailChecking = false;
        // adjust the condition to match your API response shape
        if (res?.exists === true) {
          this.emailExists = true;
          ctrl.setErrors({ emailTaken: true });
        }
      },
      error: () => {
        // silent fail — don't block the user if check fails
        this.emailChecking = false;
      },
    });
  }

  // ── Toast ────────────────────────────────────────────────
  showToast(message: string, type: 'error' | 'success') {
    this.clearToastTimers();
    this.toast         = { message, type };
    this.toastProgress = 100;

    const DURATION  = 3000;
    const TICK      = 30;
    const decrement = (TICK / DURATION) * 100;

    // Run inside NgZone so change detection fires on every tick
    this.ngZone.run(() => {
      this.toastInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.toastProgress = Math.max(0, this.toastProgress - decrement);
        });
      }, TICK);

      this.toastTimer = setTimeout(() => {
        this.ngZone.run(() => this.dismissToast());
      }, DURATION);
    });
  }

  dismissToast() {
    this.clearToastTimers();
    this.toast         = null;
    this.toastProgress = 100;
  }

  private clearToastTimers() {
    if (this.toastTimer)    { clearTimeout(this.toastTimer);     this.toastTimer    = null; }
    if (this.toastInterval) { clearInterval(this.toastInterval); this.toastInterval = null; }
  }

  // ── Countries / Location ─────────────────────────────────
  private loadCountries() {
    this.authService.getCountries().subscribe({
      next: (res: any) => { this.countries = res; this.prefetchGovernorates(res); },
      error: () => this.showToast('Failed to load countries. Please refresh.', 'error'),
    });
  }

  private prefetchGovernorates(countries: any[]) {
    if (!countries?.length) return;
    let i = 0;
    const next = () => {
      if (i >= countries.length) return;
      const c = countries[i++];
      this.authService.getGovernorates(c.id).subscribe({
        next: (govs: any) => { this.governoratesCache.set(c.id, govs); this.prefetchCities(govs); next(); },
        error: () => next(),
      });
    };
    next();
  }

  private prefetchCities(governorates: any[]) {
    if (!governorates?.length) return;
    let i = 0;
    const next = () => {
      if (i >= governorates.length) return;
      const g = governorates[i++];
      this.authService.getCities(g.id).subscribe({
        next: (cities: any) => { this.citiesCache.set(g.id, cities); next(); },
        error: () => next(),
      });
    };
    next();
  }

  onCountryChange() {
    const id = Number(this.registerForm.get('countryId')?.value);
    this.governorates = [];
    this.cities       = [];
    this.registerForm.get('governorateId')?.setValue('');
    this.registerForm.get('governorateId')?.disable();
    this.registerForm.get('cityId')?.setValue('');
    this.registerForm.get('cityId')?.disable();
    if (!id) return;

    if (this.governoratesCache.has(id)) {
      this.governorates = this.governoratesCache.get(id)!;
      this.registerForm.get('governorateId')?.enable();
    } else {
      this.authService.getGovernorates(id).subscribe({
        next: (res: any) => {
          this.governoratesCache.set(id, res);
          this.governorates = res;
          this.registerForm.get('governorateId')?.enable();
          this.prefetchCities(res);
        },
        error: () => this.showToast('Failed to load governorates.', 'error'),
      });
    }
  }

  onGovernorateChange() {
    const id = Number(this.registerForm.get('governorateId')?.value);
    this.cities = [];
    this.registerForm.get('cityId')?.setValue('');
    this.registerForm.get('cityId')?.disable();
    if (!id) return;

    if (this.citiesCache.has(id)) {
      this.cities = this.citiesCache.get(id)!;
      this.registerForm.get('cityId')?.enable();
    } else {
      this.authService.getCities(id).subscribe({
        next: (res: any) => { this.citiesCache.set(id, res); this.cities = res; this.registerForm.get('cityId')?.enable(); },
        error: () => this.showToast('Failed to load cities.', 'error'),
      });
    }
  }

  // ── Submit ───────────────────────────────────────────────
  register() {
    this.formSubmitted = true;
    this.registerForm.markAllAsTouched();

    if (this.emailExists) {
      this.showToast('هذا البريد الإلكتروني مسجل بالفعل.', 'error');
      return;
    }

    if (this.registerForm.invalid) {
      this.showToast('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح.', 'error');
      return;
    }

    this.isLoading = true;
    const form = this.registerForm.getRawValue();

    this.authService.register({
      firstName: form.firstName,
      lastName:  form.lastName,
      email:     form.email,
      password:  form.password,
      phone:     form.phone,
      cityId:    Number(form.cityId),
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showToast('تم إنشاء الحساب بنجاح! جارٍ تحويلك...', 'success');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى.';
        this.showToast(msg, 'error');
      },
    });
  }
}