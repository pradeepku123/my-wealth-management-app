import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { EventBusService } from '../services/event-bus.service';
import { SnackbarService } from '../services/snackbar.service';

declare var bootstrap: any;

@Component({
  selector: 'app-add-fund-dialog',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-fund-dialog.component.html',
  styleUrl: './add-fund-dialog.component.scss'
})
export class AddFundDialogComponent implements AfterViewInit, OnInit {
  @Input() fundData = {
    id: null,
    investment_type: '',
    fund_name: '',
    invested_amount: 0,
    current_value: 0
  };
  @Input() isEditMode = false;
  @Output() close = new EventEmitter<boolean>();
  @ViewChild('addFundModal') modalElement!: ElementRef;

  dialogTitle = 'Add Investment';
  private apiUrl = '/api/v1';
  public modal: any;

  investmentTypes = [
    { value: 'mutual_fund', label: 'Mutual Fund', icon: 'trending_up' },
    { value: 'epf', label: 'EPF (Employee Provident Fund)', icon: 'work' },
    { value: 'ppf', label: 'PPF (Public Provident Fund)', icon: 'savings' },
    { value: 'fd', label: 'FD (Fixed Deposit)', icon: 'account_balance' },
    { value: 'mis', label: 'MIS (Monthly Income Scheme)', icon: 'paid' },
    { value: 'nps', label: 'NPS (National Pension System)', icon: 'elderly' }
  ];

  constructor(
    private http: HttpClient,
    private snackbarService: SnackbarService,
    private errorHandler: ErrorHandlerService,
    private eventBus: EventBusService,
  ) {
  }

  ngOnInit() {
    if (this.isEditMode) {
      this.dialogTitle = 'Edit Investment';
    }
  }

  ngAfterViewInit() {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
  }

  isValid(): boolean {
    return this.fundData.investment_type.trim() !== '' &&
           this.fundData.fund_name.trim() !== '' &&
           this.fundData.invested_amount > 0 &&
           this.fundData.current_value > 0;
  }

  getReturns(): number {
    return this.fundData.current_value - this.fundData.invested_amount;
  }

  getReturnsPercentage(): number {
    if (this.fundData.invested_amount === 0) return 0;
    return (this.getReturns() / this.fundData.invested_amount) * 100;
  }

  onSave() {
    const request = this.isEditMode
      ? this.http.put<APIResponse>(`${this.apiUrl}/portfolio/funds/${this.fundData.id}`, this.fundData)
      : this.http.post<APIResponse>(`${this.apiUrl}/portfolio/funds`, this.fundData);

    request.subscribe({
      next: (response: APIResponse) => {
        if (response.success) {
          // Notify other parts of the app about mutual fund changes
          try {
            if (this.fundData && this.fundData.investment_type === 'mutual_fund') {
              this.eventBus.emitMutualFundUpdated({ fund: this.fundData });
            }
          } catch (e) {
            // non-fatal - continue
            console.warn('EventBus emit failed', e);
          }

          this.snackbarService.show(response.message, 'success');
          this.modal.hide();
          this.close.emit(true);
        } else {
          this.snackbarService.show(response.message || 'Operation failed', 'error');
        }
      },
      error: (error) => {
        this.snackbarService.show(this.errorHandler.extractErrorMessage(error), 'error');
      }
    });
  }

  onCancel() {
    this.modal.hide();
    this.close.emit(false);
  }
}