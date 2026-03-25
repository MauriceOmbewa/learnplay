import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { UserDataService } from '../services/user-data.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  console.log('🔵 [AUTH GUARD] Checking access for route:', state.url);
  console.log('🔵 [AUTH GUARD] Required role:', route.data['role']);
  
  const router = inject(Router);
  const userDataService = inject(UserDataService);
  
  const userRole = userDataService.getUserRole();
  console.log('🔵 [AUTH GUARD] Current user role:', userRole);
  
  const requiredRole = route.data['role'];

  if (!userRole) {
    console.log('🔴 [AUTH GUARD] No user role found, redirecting to sign-in');
    return router.createUrlTree(['/sign-up/sign-in']);
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log('🔴 [AUTH GUARD] Role mismatch. Required:', requiredRole, 'Got:', userRole);
    if (userRole === 'ADMIN') {
      console.log('🟡 [AUTH GUARD] Redirecting ADMIN to /teacher');
      return router.createUrlTree(['/teacher']);
    } else if (userRole === 'GUARDIAN') {
      console.log('🟡 [AUTH GUARD] Redirecting GUARDIAN to /parent');
      return router.createUrlTree(['/parent']);
    } else {
      console.log('🔴 [AUTH GUARD] Unknown role, redirecting to sign-in');
      return router.createUrlTree(['/sign-up/sign-in']);
    }
  }

  console.log('🟢 [AUTH GUARD] Access granted for route:', state.url);
  return true;
};
