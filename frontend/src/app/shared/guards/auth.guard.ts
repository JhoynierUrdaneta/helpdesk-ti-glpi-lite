import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  const token = authService.getToken();

  if (!user || !token) {
    return router.createUrlTree(['/auth/login']);
  }

  if (user.must_change_password) {
    return router.createUrlTree(['/auth/cambiar-clave']);
  }

  return true;
};
