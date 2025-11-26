import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AccessibilityBarComponent } from '../shared/accessibility-bar.component';
import { AuthService } from '../services/auth.service';
import { SessionTimeoutService } from '../services/session-timeout.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { Subscription } from 'rxjs';

import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../shared/components/header/header.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterModule, AccessibilityBarComponent, CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  isSidenavOpen = true;
  userName = '';
  userRole = '';
  sessionTimeRemaining = '';
  showSessionTimer = false;
  private apiUrl = '/api/v1';
  private sessionSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private sessionTimeoutService: SessionTimeoutService
  ) { }

  ngOnInit() {
    this.loadUserInfo();
    this.initializeSession();
  }

  ngOnDestroy() {
    this.sessionSubscription.unsubscribe();
    this.sessionTimeoutService.stopSession();
  }

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  private initializeSession() {
    this.sessionTimeoutService.startSession();

    this.sessionSubscription.add(
      this.sessionTimeoutService.sessionExpired$.subscribe(() => {
        this.showSessionExpiredDialog();
      })
    );

    this.sessionSubscription.add(
      this.sessionTimeoutService.remainingTime$.subscribe(timeMs => {
        this.sessionTimeRemaining = this.formatTime(timeMs);
      })
    );

    this.sessionSubscription.add(
      this.sessionTimeoutService.showTimer$.subscribe(show => {
        this.showSessionTimer = show;
      })
    );
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private showSessionExpiredDialog() {
    // Replace with bootstrap modal logic
    this.logout();
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
    this.sessionTimeoutService.stopSession();
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}