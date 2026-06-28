import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthStateService } from '../services/auth-state';

export const guestGuard: CanActivateFn = () => {
  const authState =
    inject(AuthStateService);

  const router =
    inject(Router);

  if (authState.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};