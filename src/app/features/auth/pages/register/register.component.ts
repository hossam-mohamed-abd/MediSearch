// register.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  countries:    any[] = [];
  governorates: any[] = [];
  cities:       any[] = [];

  isLoading = false;
  showPass  = false;

  private governoratesCache = new Map<number, any[]>();
  private citiesCache       = new Map<number, any[]>();

  registerForm = this.fb.group({
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    phone:           ['', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    countryId:       ['', Validators.required],
    governorateId:   [{ value: '', disabled: true }, Validators.required],
    cityId:          [{ value: '', disabled: true }, Validators.required],
  });

  ngOnInit() {
    this.loadCountries();
  }

  private loadCountries() {
    this.authService.getCountries().subscribe({
      next: (res: any) => {
        this.countries = res;
        this.prefetchGovernorates(res);
      },
      error: (err) => console.error('Failed to load countries', err),
    });
  }

  private prefetchGovernorates(countries: any[]) {
    if (!countries?.length) return;
    let index = 0;

    const loadNext = () => {
      if (index >= countries.length) return;
      const country = countries[index++];
      this.authService.getGovernorates(country.id).subscribe({
        next: (govs: any) => {
          this.governoratesCache.set(country.id, govs);
          this.prefetchCities(govs);
          loadNext();
        },
        error: () => loadNext(),
      });
    };

    loadNext();
  }

  private prefetchCities(governorates: any[]) {
    if (!governorates?.length) return;
    let index = 0;

    const loadNext = () => {
      if (index >= governorates.length) return;
      const gov = governorates[index++];
      this.authService.getCities(gov.id).subscribe({
        next: (cities: any) => {
          this.citiesCache.set(gov.id, cities);
          loadNext();
        },
        error: () => loadNext(),
      });
    };

    loadNext();
  }

  onCountryChange() {
    const countryId = Number(this.registerForm.get('countryId')?.value);

    // Reset dependents
    this.governorates = [];
    this.cities       = [];
    this.registerForm.get('governorateId')?.setValue('');
    this.registerForm.get('governorateId')?.disable();
    this.registerForm.get('cityId')?.setValue('');
    this.registerForm.get('cityId')?.disable();

    if (!countryId) return;

    if (this.governoratesCache.has(countryId)) {
      this.governorates = this.governoratesCache.get(countryId)!;
      this.registerForm.get('governorateId')?.enable();
    } else {
      this.authService.getGovernorates(countryId).subscribe({
        next: (res: any) => {
          this.governoratesCache.set(countryId, res);
          this.governorates = res;
          this.registerForm.get('governorateId')?.enable();
          this.prefetchCities(res);
        },
        error: (err) => console.error('Failed to load governorates', err),
      });
    }
  }

  onGovernorateChange() {
    const governorateId = Number(this.registerForm.get('governorateId')?.value);

    // Reset city
    this.cities = [];
    this.registerForm.get('cityId')?.setValue('');
    this.registerForm.get('cityId')?.disable();

    if (!governorateId) return;

    if (this.citiesCache.has(governorateId)) {
      this.cities = this.citiesCache.get(governorateId)!;
      this.registerForm.get('cityId')?.enable();
    } else {
      this.authService.getCities(governorateId).subscribe({
        next: (res: any) => {
          this.citiesCache.set(governorateId, res);
          this.cities = res;
          this.registerForm.get('cityId')?.enable();
        },
        error: (err) => console.error('Failed to load cities', err),
      });
    }
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

    this.authService.register({
      firstName: form.firstName,
      lastName:  form.lastName,
      email:     form.email,
      password:  form.password,
      phone:     form.phone,
      cityId:    Number(form.cityId),
    }).subscribe({
      next:  () => { this.isLoading = false; this.router.navigate(['/']); },
      error: (err) => { this.isLoading = false; console.error(err); },
    });
  }
}