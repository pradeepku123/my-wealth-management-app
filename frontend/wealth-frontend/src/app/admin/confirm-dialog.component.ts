import { Component, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header border-0 pb-0">
      <h5 class="modal-title fw-bold" [class.text-danger]="data.title === 'Error'">{{ data.title }}</h5>
    </div>
    <div class="modal-body py-4">
      <p class="mb-0 text-muted">{{ data.message }}</p>
    </div>
    <div class="modal-footer border-0 pt-0">
      <button type="button" class="btn btn-light" (click)="onCancel()" *ngIf="data.cancelText">
        {{ data.cancelText }}
      </button>
      <button type="button" class="btn" 
              [class.btn-primary]="data.title !== 'Error'" 
              [class.btn-danger]="data.title === 'Error'"
              (click)="onConfirm()">
        {{ data.confirmText }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ConfirmDialogComponent {
  data: any;

  constructor(public activeModal: NgbActiveModal) { }

  onConfirm(): void {
    this.activeModal.close(true);
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }
}