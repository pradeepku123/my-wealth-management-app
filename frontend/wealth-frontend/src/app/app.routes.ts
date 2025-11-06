import { Routes } from '@angular/router';
import { WealthDashboardComponent } from './wealth-dashboard/wealth-dashboard.component';
import { LoginComponent } from './login/login.component';
import { DashboardLayoutComponent } from './layout/dashboard-layout.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { MutualFundsComponent } from './market/mutual-funds.component';
import { DatabaseViewerComponent } from './admin/database-viewer.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: WealthDashboardComponent },
      { path: 'portfolio', component: PortfolioComponent },
      { path: 'mutual-funds', component: MutualFundsComponent },
      { path: 'database-admin', component: DatabaseViewerComponent },
      { path: 'investments', component: WealthDashboardComponent },
      { path: 'reports', component: WealthDashboardComponent }
    ]
  }
];
