import { Component, inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  private router = inject(Router);

  countries: any[] = [];
  governorates: any[] = [];
  cities: any[] = [];

  isLoading = false;

  registerForm = this.fb.group({
    firstName: ['', Validators.required],

    lastName: ['', Validators.required],

    email: ['', [Validators.required, Validators.email]],

    phone: ['', Validators.required],

    password: ['', [Validators.required, Validators.minLength(8)]],

    confirmPassword: ['', Validators.required],

    countryId: ['', Validators.required],

    governorateId: ['', Validators.required],

    cityId: ['', Validators.required],
  });

  ngOnInit() {
    this.getCountries();
  }

  getCountries() {
    this.authService.getCountries().subscribe((res: any) => {
      this.countries = res;
    });
  }

  onCountryChange() {
    const countryId = Number(this.registerForm.value.countryId);

    this.governorates = [];
    this.cities = [];

    this.authService.getGovernorates(countryId).subscribe((res: any) => {
      this.governorates = res;
    });
  }

  onGovernorateChange() {
    const governorateId = Number(this.registerForm.value.governorateId);

    this.cities = [];

    this.authService.getCities(governorateId).subscribe((res: any) => {
      this.cities = res;
    });
  }

  register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      return;
    }

    const form = this.registerForm.getRawValue();

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');

      return;
    }

    this.isLoading = true;

    this.authService
      .register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        cityId: Number(form.cityId),
      })
      .subscribe({
        next: () => {
          this.isLoading = false;

          this.router.navigate(['/']);
        },

        error: (err) => {
          this.isLoading = false;

          console.log(err);
        },
      });
  }
}
