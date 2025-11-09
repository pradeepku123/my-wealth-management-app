import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { AccessibilityBarComponent } from '../shared/accessibility-bar.component';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, MatMenuModule, RouterModule, AccessibilityBarComponent, CommonModule],
  templateUrl: './dashboard-layout.component.html',
  styles: [`
    mat-sidenav::-webkit-scrollbar {
      width: 6px;
    }
    
    mat-sidenav::-webkit-scrollbar-track {
      background: #f3f4f6;
    }
    
    mat-sidenav::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
    
    mat-sidenav::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `]
})
export class DashboardLayoutComponent implements OnInit {
  userName = '';
  userRole = '';
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(private router: Router, private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;
        
        this.http.get<APIResponse>(`${this.apiUrl}/auth/user-info?user_id=${userId}`).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.userName = response.data.full_name || userId;
              this.userRole = response.data.role || 'user';
            }
          },
          error: () => {
            this.userName = userId;
            this.userRole = 'user';
          }
        });
      } catch {
        this.userName = 'User';
        this.userRole = 'user';
      }
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}