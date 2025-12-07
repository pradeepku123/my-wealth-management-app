import { Routes } from '@angular/router';
import { WealthDashboardComponent } from './wealth-dashboard/wealth-dashboard.component';
import { LoginComponent } from './login/login.component';
import { DashboardLayoutComponent } from './layout/dashboard-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { MutualFundsComponent } from './market/mutual-funds.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { GoalsComponent } from './goals/goals.component';
import { DatabaseViewerComponent } from './admin/database-viewer.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SipCalculatorComponent } from './sip/sip-calculator.component';
import { SwpCalculatorComponent } from './swp/swp-calculator.component';
import { InflationCalculatorComponent } from './inflation/inflation-calculator.component';
import { BudgetPlannerComponent } from './budget/budget-planner.component';
import { RecommendationsComponent } from './recommendations/recommendations.component';
import { FundDetailsComponent } from './recommendations/fund-details/fund-details.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent }
    ]
  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: WealthDashboardComponent },
      { path: 'portfolio', component: PortfolioComponent },
      { path: 'mutual-funds', component: MutualFundsComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'goals', component: GoalsComponent },
      { path: 'database-admin', component: DatabaseViewerComponent, canActivate: [AdminGuard] },


      { path: 'sip', component: SipCalculatorComponent },
      { path: 'swp', component: SwpCalculatorComponent },
      { path: 'inflation', component: InflationCalculatorComponent },
      { path: 'budget', component: BudgetPlannerComponent },
      { path: 'recommendations', component: RecommendationsComponent },
      { path: 'recommendations/fund/:schemeCode', component: FundDetailsComponent },
      { path: 'fact-sheet-analysis', loadComponent: () => import('./fund-analysis/fact-sheet-analysis.component').then(m => m.FactSheetAnalysisComponent) },
      { path: 'risk-profiling', loadComponent: () => import('./pages/risk-profiling/risk-profiling.component').then(m => m.RiskProfilingComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
