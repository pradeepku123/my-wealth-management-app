import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accessibility-bar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, CommonModule],
  template: `
    <div class="accessibility-bar" [class.expanded]="isExpanded">
      <button mat-icon-button 
              class="toggle-btn"
              (click)="toggleBar()"
              matTooltip="Accessibility Options">
        <mat-icon>accessibility</mat-icon>
      </button>
      
      <div class="controls" *ngIf="isExpanded">
        <button mat-button (click)="increaseFontSize()" matTooltip="Increase Font Size">
          <mat-icon>text_increase</mat-icon>
          A+
        </button>
        
        <button mat-button (click)="decreaseFontSize()" matTooltip="Decrease Font Size">
          <mat-icon>text_decrease</mat-icon>
          A-
        </button>
        
        <button mat-button (click)="resetFontSize()" matTooltip="Reset Font Size">
          <mat-icon>refresh</mat-icon>
          Reset
        </button>
        
        <button mat-button (click)="toggleHighContrast()" matTooltip="High Contrast">
          <mat-icon>contrast</mat-icon>
          Contrast
        </button>
        
        <button mat-button (click)="toggleDarkMode()" matTooltip="Dark Mode">
          <mat-icon>dark_mode</mat-icon>
          Dark
        </button>
      </div>
    </div>
  `,
  styles: [`
    .accessibility-bar {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      background: #fff;
      border: 2px solid #1976d2;
      border-radius: 8px 0 0 8px;
      box-shadow: -2px 0 8px rgba(0,0,0,0.2);
      z-index: 1000;
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
    }

    .toggle-btn {
      background: #1976d2 !important;
      color: white !important;
      border-radius: 6px 0 0 6px;
    }

    .controls {
      display: flex;
      flex-direction: column;
      padding: 8px;
      gap: 4px;
      min-width: 120px;
    }

    .controls button {
      justify-content: flex-start;
      font-size: 12px;
      padding: 4px 8px;
      min-height: 32px;
    }

    .controls mat-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .accessibility-bar:not(.expanded) {
      width: 48px;
    }
  `]
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
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-theme');
  }
}