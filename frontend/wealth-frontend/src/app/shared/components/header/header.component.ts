import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styles: [`
    :host { display: block; }

    .navbar {
      padding: 0.75rem 0;
      height: 60px;
    }

    .sidebar-toggle-btn {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-glass-light);
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-base);
      flex-shrink: 0;

      &:hover {
        background: var(--bg-hover);
        color: var(--primary-color);
        border-color: var(--border-highlight);
      }
    }

    .icon-btn {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background: var(--bg-glass-light);
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-base);

      &:hover {
        background: var(--bg-hover);
        color: var(--primary-color);
        border-color: var(--border-highlight);
      }
    }

    .market-badge {
      background: var(--success-bg);
      border: 1px solid rgba(0, 212, 170, 0.2);
      border-radius: 99px;
      padding: 0.3rem 0.8rem;
      color: var(--accent-color);
      font-size: 0.78rem;
    }

    .session-badge {
      background: var(--warning-bg);
      border: 1px solid var(--border-gold);
      border-radius: 99px;
      padding: 0.3rem 0.8rem;
      color: var(--gold);
      font-size: 0.78rem;
      font-weight: 600;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-main);
      line-height: 1.2;
    }

    .user-role {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    .user-avatar {
      width: 36px; height: 36px;
      background: var(--accent-gradient);
      color: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      font-family: 'Space Grotesk', sans-serif;
      box-shadow: 0 2px 8px rgba(108, 99, 255, 0.4);
      flex-shrink: 0;
    }
  `]
})
export class HeaderComponent {
  @Input() userName: string = '';
  @Input() userRole: string = '';
  @Input() sessionTimeRemaining: string = '';
  @Input() showSessionTimer: boolean = false;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  constructor(public themeService: ThemeService) { }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onLogout() {
    this.logout.emit();
  }

  onToggleTheme() {
    this.themeService.toggleTheme();
  }

  getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
}
