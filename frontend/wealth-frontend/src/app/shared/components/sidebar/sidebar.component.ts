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
      border-right: 1px solid rgba(0,0,0,0.05);
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none;  /* IE and Edge */
      position: relative;
    }
    
    :host::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
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

    .scroll-indicator {
      position: fixed;
      bottom: 1rem;
      left: 1rem; /* Adjust based on sidebar width, usually 250px or so */
      width: 250px; /* Match sidebar width */
      text-align: center;
      pointer-events: auto;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 10;
    }

    .scroll-indicator.visible {
      opacity: 1;
    }

    .scroll-indicator i {
      background: rgba(255, 255, 255, 0.8); /* Make it more visible/clickable */
      color: var(--primary-color);
      border-radius: 50%;
      padding: 0.5rem;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
      40% {transform: translateY(-5px);}
      60% {transform: translateY(-3px);}
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

  ngAfterViewInit() {
    this.checkScroll();
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

  showConfirm = false;

  populateTestData() {
    if (!this.showConfirm) {
      this.showConfirm = true;
      // Auto-hide confirmation after 3 seconds if not clicked
      setTimeout(() => {
        this.showConfirm = false;
      }, 3000);
      return;
    }

    this.showConfirm = false;
    this.http.post(`${this.apiUrl}/test-data/populate`, {}).subscribe({
      next: (response: any) => {
        // Use a toast or snackbar if available, otherwise just reload
        window.location.reload();
      },
      error: (error) => {
        console.error('Error populating test data:', error);
      }
    });
  }
}
