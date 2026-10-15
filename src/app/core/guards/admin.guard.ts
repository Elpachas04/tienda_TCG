import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminGuard: CanActivateFn = async () => {
  // inject() solo funciona antes del primer await: después ya no hay contexto de inyección
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const authenticated = await auth.checkSession();
  return authenticated ? true : router.createUrlTree(['/admin/login']);
};
