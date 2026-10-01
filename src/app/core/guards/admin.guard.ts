import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminGuard: CanActivateFn = async () => {
  const authenticated = await inject(AdminAuthService).checkSession();
  return authenticated ? true : inject(Router).createUrlTree(['/admin/login']);
};
