import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SessionTimeoutService } from '../services/session-timeout.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private sessionTimeoutService: SessionTimeoutService
  ) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      this.sessionTimeoutService.startSession();
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}