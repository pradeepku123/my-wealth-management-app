import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accessibility-bar',
  standalone: true,
  imports: [CommonModule],
    template: `
      <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1050;">
        <!-- Controls Menu -->
        <div *ngIf="isExpanded" class="d-flex flex-column align-items-center mb-2">
          <button class="btn btn-light btn-sm mb-2" (click)="toggleHighContrast()" title="High Contrast">
            <i class="bi bi-contrast"></i>
          </button>
          <button class="btn btn-light btn-sm mb-2" (click)="toggleDarkMode()" title="Dark Mode">
            <i class="bi bi-moon-stars-fill"></i>
          </button>
          <button class="btn btn-light btn-sm mb-2" (click)="increaseFontSize()" title="Increase Font Size">
            <i class="bi bi-zoom-in"></i>
          </button>
          <button class="btn btn-light btn-sm mb-2" (click)="decreaseFontSize()" title="Decrease Font Size">
            <i class="bi bi-zoom-out"></i>
          </button>
          <button class="btn btn-light btn-sm" (click)="resetFontSize()" title="Reset Font Size">
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
        </div>

        <!-- Main FAB -->
        <button class="btn btn-primary btn-lg rounded-circle"
                (click)="toggleBar()"
                title="Accessibility Options">
          <i class="bi bi-universal-access-circle"></i>
        </button>
      </div>
    `,
    styles: [``]
  })
  export class AccessibilityBarComponent {
    isExpanded = false;
    currentFontSize = 100;

    toggleBar() {
      this.isExpanded = !this.isExpanded;
    }

    increaseFontSize() {
      if (this.currentFontSize < 150) {
        this.currentFontSize += 10;
        this.applyFontSize();
      }
    }

    decreaseFontSize() {
      if (this.currentFontSize > 80) {
        this.currentFontSize -= 10;
        this.applyFontSize();
      }
    }

    resetFontSize() {
      this.currentFontSize = 100;
      this.applyFontSize();
    }

    private applyFontSize() {
      document.documentElement.style.fontSize = `${this.currentFontSize}%`;
    }

    toggleHighContrast() {
      document.body.classList.toggle('high-contrast');
      if (this.isExpanded) {
        this.toggleBar();
      }
    }

    toggleDarkMode() {
      document.body.classList.toggle('dark-theme');
      if (this.isExpanded) {
        this.toggleBar();
      }
    }
  }