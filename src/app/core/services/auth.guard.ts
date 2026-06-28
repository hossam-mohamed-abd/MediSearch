import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.profile().pipe(
    map(() => {
      router.navigate(['/']);
      return false;
    }),

    catchError(() => {
      return of(true);
    })
  );
};