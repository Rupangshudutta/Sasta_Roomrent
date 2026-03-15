import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/auth/login']);
  return false;
};

export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/auth/login']);
      return false;
    }

    const role = auth.userRole();
    if (role && roles.includes(role)) return true;

    router.navigate(['/']);
    return false;
  };
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  // Redirect authenticated users to their dashboard
  const role = auth.userRole();
  if (role === 'admin') router.navigate(['/dashboard/admin']);
  else if (role === 'owner') router.navigate(['/dashboard/owner']);
  else router.navigate(['/dashboard/customer']);

  return false;
};
