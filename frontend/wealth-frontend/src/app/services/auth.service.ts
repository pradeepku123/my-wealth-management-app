import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  getUserRole(): string {
    const token = localStorage.getItem('token');
    if (!token) return 'guest';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);
      // For admin user, return admin role
      if (payload.sub === 'admin') {
        return 'admin';
      }
      return payload.role || 'user';
    } catch {
      return 'user';
    }
  }

  getUserId(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || '';
    } catch {
      return '';
    }
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isUser(): boolean {
    return this.getUserRole() === 'user';
  }

  hasAccess(requiredRole: string): boolean {
    const userRole = this.getUserRole();
    
    if (requiredRole === 'admin') {
      return userRole === 'admin';
    }
    
    if (requiredRole === 'user') {
      return userRole === 'user' || userRole === 'admin';
    }
    
    return true;
  }
}