import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { AccessibilityBarComponent } from '../shared/accessibility-bar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, RouterOutlet, RouterModule, AccessibilityBarComponent],
  templateUrl: './dashboard-layout.component.html',
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      width: 220px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .content {
      padding: 20px;
    }
    .nav-item {
      display: flex !important;
      align-items: center !important;
      
      mat-icon {
        margin-right: 16px !important;
        min-width: 24px;
        flex-shrink: 0;
      }
      
      span {
        line-height: 1;
        flex: 1;
      }
    }
  `]
})
export class DashboardLayoutComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}