import { Routes } from '@angular/router';
import { WealthDashboardComponent } from './wealth-dashboard/wealth-dashboard.component';

export const routes: Routes = [
  { path: '', component: WealthDashboardComponent },
  { path: 'dashboard', component: WealthDashboardComponent }
];
