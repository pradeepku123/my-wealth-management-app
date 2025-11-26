import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal" tabindex="-1" style="display: block;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-clock-history me-2"></i>Session Expired</h5>
            <button type="button" class="btn-close" (click)="close()"></button>
          </div>
          <div class="modal-body">
            <p>Your session has expired due to inactivity. For your security, you have been automatically logged out.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" (click)="close()">Go to Login</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  `
})
export class SessionTimeoutDialogComponent {
  constructor() {}

  close() {
    // This should be handled by the parent component
  }
}