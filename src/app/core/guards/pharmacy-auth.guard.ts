import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { PharmacyAuthService } from '../services/pharmacy-auth.service';

import { map, catchError, of } from 'rxjs';

export const pharmacyAuthGuard: CanActivateFn = () => {
  const auth = inject(PharmacyAuthService);

  const router = inject(Router);

  return auth.profile().pipe(
    map(() => true),

    catchError(() => {
      router.navigate(['/pharmacy/login']);

      return of(false);
    }),
  );
};