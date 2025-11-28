import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GoalService } from '../services/goal.service';
import { Goal } from '../models/goal';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit {
  goals: Goal[] = [];
  goalForm: FormGroup;
  linkInvestmentForm: FormGroup;
  selectedGoal: Goal | null = null;
  availableInvestments: any[] = [];

  @ViewChild('goalModal') goalModal!: TemplateRef<any>;
  @ViewChild('linkInvestmentModal') linkInvestmentModal!: TemplateRef<any>;

  constructor(
    private goalService: GoalService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.goalForm = this.fb.group({
      name: ['', Validators.required],
      target_amount: [0, [Validators.required, Validators.min(1)]],
      target_date: ['', Validators.required],
      monthly_sip_amount: [0],
      expected_return: [12, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    this.setupSipCalculation();

    this.linkInvestmentForm = this.fb.group({
      investment_ids: [[], Validators.required]
    });
  }

  setupSipCalculation() {
    this.goalForm.valueChanges.subscribe(val => {
      if (val.target_amount && val.target_date && val.expected_return) {
        this.calculateSIP(val.target_amount, val.target_date, val.expected_return);
      }
    });
  }

  calculateSIP(targetAmount: number, targetDateStr: string, rateOfReturn: number) {
    const targetDate = new Date(targetDateStr);
    const today = new Date();

    // Calculate months difference
    let months = (targetDate.getFullYear() - today.getFullYear()) * 12;
    months -= today.getMonth();
    months += targetDate.getMonth();

    if (months <= 0) {
      this.goalForm.patchValue({ monthly_sip_amount: targetAmount }, { emitEvent: false });
      return;
    }

    // SIP Formula: P = M / [ { (1 + i)^n - 1 } / i ] * (1 + i)
    // Where P = SIP Amount, M = Target Amount, i = monthly rate, n = months

    const i = rateOfReturn / 12 / 100;

    if (i === 0) {
      const sip = targetAmount / months;
      this.goalForm.patchValue({ monthly_sip_amount: Math.round(sip) }, { emitEvent: false });
      return;
    }

    const factor = Math.pow(1 + i, months) - 1;
    const sip = targetAmount / ((factor / i) * (1 + i));

    this.goalForm.patchValue({ monthly_sip_amount: Math.round(sip) }, { emitEvent: false });
  }

  ngOnInit() {
    this.loadGoals();
    this.loadInvestments();
  }

  loadGoals() {
    this.goalService.getGoals().subscribe({
      next: (goals) => {
        this.goals = goals;
      },
      error: (err) => console.error('Error loading goals', err)
    });
  }

  loadInvestments() {
    // Use the new endpoint that filters available investments
    this.apiService.get<any>('goals/available-investments').subscribe({
      next: (data: any) => {
        this.availableInvestments = data || [];
        console.log('Loaded available investments:', this.availableInvestments);
      },
      error: (err) => console.error('Error loading investments', err)
    });
  }

  openAddGoalModal() {
    this.goalForm.reset({
      target_amount: 0,
      monthly_sip_amount: 0
    });
    this.modalService.open(this.goalModal, { size: 'lg' });
  }

  saveGoal() {
    if (this.goalForm.valid) {
      const goalData = this.goalForm.value;
      this.goalService.createGoal(goalData).subscribe({
        next: (newGoal) => {
          this.loadGoals();
          this.modalService.dismissAll();
        },
        error: (err) => console.error('Error creating goal', err)
      });
    }
  }

  openLinkInvestmentModal(goal: Goal) {
    this.selectedGoal = goal;
    this.linkInvestmentForm.patchValue({
      investment_ids: goal.linked_investments || []
    });

    // Refresh investments to get latest remaining amounts
    this.loadInvestments();

    this.modalService.open(this.linkInvestmentModal, { size: 'lg' });
  }

  saveLinkedInvestments() {
    if (this.selectedGoal && this.selectedGoal.id) {
      const investmentIds = this.linkInvestmentForm.value.investment_ids;
      this.goalService.linkInvestments(this.selectedGoal.id, investmentIds).subscribe({
        next: (updatedGoal) => {
          this.loadGoals();
          this.modalService.dismissAll();
        },
        error: (err) => console.error('Error linking investments', err)
      });
    }
  }

  // Helper to check if an investment is selected in the multi-select
  isInvestmentSelected(invId: number): boolean {
    const selectedIds = this.linkInvestmentForm.value.investment_ids || [];
    return selectedIds.includes(invId);
  }

  toggleInvestmentSelection(invId: number) {
    const currentIds = this.linkInvestmentForm.value.investment_ids || [];
    let newIds = [];
    if (currentIds.includes(invId)) {
      newIds = currentIds.filter((id: number) => id !== invId);
    } else {
      newIds = [...currentIds, invId];
    }
    this.linkInvestmentForm.patchValue({ investment_ids: newIds });
  }
}