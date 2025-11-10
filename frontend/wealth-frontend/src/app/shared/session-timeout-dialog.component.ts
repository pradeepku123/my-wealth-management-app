import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  template: `
    <div class="bg-white rounded-lg p-6 max-w-md">
      <div class="flex items-center mb-4">
        <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
          <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-900">Session Expired</h2>
      </div>
      
      <p class="text-gray-600 mb-6">
        Your session has expired due to inactivity. For your security, you have been automatically logged out.
      </p>
      
      <div class="flex justify-end">
        <button mat-flat-button (click)="close()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Go to Login
        </button>
      </div>
    </div>
  `
})
export class SessionTimeoutDialogComponent {
  constructor(private dialogRef: MatDialogRef<SessionTimeoutDialogComponent>) {}

  close() {
    this.dialogRef.close();
  }
}