import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow-y: auto;
      background-color: var(--bg-sidebar);
      border-right: 1px solid rgba(0,0,0,0.05);
    }
    
    .sidebar-brand {
      padding: 1.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      i {
        font-size: 1.5rem;
        color: var(--accent-color);
      }
    }
    
    .nav-category {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      padding: 1rem 1.5rem 0.5rem;
      font-weight: 600;
    }
  `]
})
export class SidebarComponent {
    @Output() logout = new EventEmitter<void>();

    constructor(private authService: AuthService) { }

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    onLogout() {
        this.logout.emit();
    }
}
