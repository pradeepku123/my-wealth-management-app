import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="snackbar" [ngClass]="'alert-' + type">
      {{ message }}
    </div>
  `,
  styles: [`
    .snackbar {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 1rem 1.5rem;
      border-radius: 0.25rem;
      color: #fff;
      z-index: 1080;
    }
  `]
})
export class SnackbarComponent {
  @Input() message = '';
  @Input() type = 'info';
  visible = false;
}
