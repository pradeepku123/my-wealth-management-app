import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { SessionTimeoutService } from '../services/session-timeout.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sessionTimeoutService = inject(SessionTimeoutService);
  const token = localStorage.getItem('token');
  
  if (token) {
    sessionTimeoutService.startSession();
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};