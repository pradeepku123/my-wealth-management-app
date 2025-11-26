import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="card h-100 border-0">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 class="text-muted text-uppercase fw-bold small mb-1">{{ title }}</h6>
            <h2 class="display-6 fw-bold mb-0 text-premium">{{ value }}</h2>
          </div>
          <div class="icon-box rounded-3 d-flex align-items-center justify-content-center" 
               [ngClass]="iconBgClass">
            <i [class]="'bi ' + icon + ' fs-4 ' + iconColorClass"></i>
          </div>
        </div>
        
        @if (trend) {
          <div class="d-flex align-items-center small">
            <span [class]="trend >= 0 ? 'text-success' : 'text-danger'" class="fw-bold me-2 d-flex align-items-center">
              <i [class]="trend >= 0 ? 'bi bi-arrow-up-short' : 'bi bi-arrow-down-short'" class="fs-5"></i>
              {{ trend | number:'1.2-2' }}%
            </span>
            <span class="text-muted">vs last month</span>
          </div>
        }
        
        @if (subtitle) {
          <p class="text-muted small mb-0">{{ subtitle }}</p>
        }
      </div>
    </div>
  `,
    styles: [`
    .icon-box {
      width: 48px;
      height: 48px;
    }
  `]
})
export class StatCardComponent {
    @Input() title: string = '';
    @Input() value: string = '';
    @Input() icon: string = 'bi-graph-up';
    @Input() iconBgClass: string = 'bg-primary-subtle';
    @Input() iconColorClass: string = 'text-primary';
    @Input() trend?: number;
    @Input() subtitle?: string;
}
