import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, RouterOutlet, RouterModule],
  templateUrl: './dashboard-layout.component.html',
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      width: 200px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .content {
      padding: 20px;
    }
    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 10px;
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