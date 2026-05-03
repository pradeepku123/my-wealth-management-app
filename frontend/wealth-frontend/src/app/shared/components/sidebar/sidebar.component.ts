import { Component, EventEmitter, Output, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import { HttpClient } from '@angular/common/http';

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
      scrollbar-width: none;
      -ms-overflow-style: none;
      position: relative;
      border-right: 1px solid var(--border-color);
    }
    :host::-webkit-scrollbar { display: none; }

    .sidebar-brand {
      padding: 1.5rem 1.25rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 0.5rem;
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      background: var(--accent-gradient);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(108, 99, 255, 0.4);

      i {
        font-size: 1.1rem;
        color: white;
      }
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .brand-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.03em;
    }

    .brand-tag {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .calc-submenu {
      background: var(--bg-glass-light);
      border: 1px solid var(--border-color);
    }

    .logout-btn {
      background: var(--danger-bg);
      border: 1px solid rgba(255, 71, 87, 0.2);
      color: var(--danger-color);
      font-size: 0.875rem;
      transition: var(--transition-base);

      &:hover {
        background: rgba(255, 71, 87, 0.2);
        border-color: var(--danger-color);
        transform: none;
      }
    }

    .scroll-indicator {
      position: fixed;
      bottom: 1rem;
      left: 1rem;
      width: 250px;
      text-align: center;
      pointer-events: none;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 10;

      &.visible { opacity: 1; pointer-events: auto; }

      i {
        background: var(--bg-elevated);
        border: 1px solid var(--border-color);
        color: var(--primary-color);
        border-radius: 50%;
        padding: 0.4rem 0.5rem;
        font-size: 0.8rem;
        box-shadow: var(--shadow-glow);
        animation: bounce 2s infinite;
      }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
  `]
})
export class SidebarComponent implements AfterViewInit {
  @Output() logout = new EventEmitter<void>();
  private apiUrl = '/api/v1';
  canScrollDown = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private elementRef: ElementRef
  ) { }

  showCalculators = false;

  ngAfterViewInit() {
    // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    // because checkScroll updates a property bound in the template
    setTimeout(() => {
      this.checkScroll();
    });
  }

  toggleCalculators() {
    this.showCalculators = !this.showCalculators;
  }

  @HostListener('scroll', ['$event'])
  onScroll(event: Event) {
    this.checkScroll();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScroll();
  }

  scrollDown() {
    const element = this.elementRef.nativeElement;
    element.scrollBy({ top: 150, behavior: 'smooth' });
  }

  private checkScroll() {
    const element = this.elementRef.nativeElement;
    // Check if we can scroll further down
    // Use a small buffer (1px) for float precision issues
    this.canScrollDown = element.scrollHeight - element.scrollTop > element.clientHeight + 1;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onLogout() {
    this.logout.emit();
  }


}
