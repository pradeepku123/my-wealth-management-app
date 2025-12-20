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
    :host {
      display: block;
    }
    .navbar {
      background-color: var(--bg-glass); /* Use variable instead of hardcoded rgba */
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0,0,0,0.05); /* This might need a var too, but low priority */
      padding: 0.75rem 1.5rem;
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      background-color: var(--accent-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.1rem;
    }
    .session-badge {
      font-size: 0.8rem;
      padding: 0.35em 0.8em;
      border-radius: 20px;
    }
    .theme-toggle {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
        cursor: pointer;
        color: var(--text-secondary);
        border: none;
        background: transparent;
    }
    .theme-toggle:hover {
        background-color: var(--primary-light);
        color: var(--primary-color);
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
