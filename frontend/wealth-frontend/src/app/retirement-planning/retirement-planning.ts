import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { RetirementService, RetirementPlan, FundInput, RebalancingRule } from '../services/retirement.service';
import { SnackbarService } from '../services/snackbar.service';




interface MonthlyDetail {
  month: number;
  openingBalance: number;
  withdrawal: number;
  growth: number;
  closingBalance: number;
}

interface FundYearResult {
  fundName: string;
  openingBalance: number;
  totalWithdrawal: number;
  growth: number;
  closingBalance: number;
  monthlyDetails: MonthlyDetail[];
  rebalancingIn: number;
  rebalancingOut: number;
  rateOfReturn: number;
  logs: RebalancingLog[];
}

export interface RebalancingLog {
  type: 'in' | 'out' | 'skip';
  relatedFundName: string;
  amount?: number;
  reason: string;
}

interface YearResult {
  year: number;
  age: number;
  totalOpeningBalance: number;
  totalWithdrawal: number;
  totalTax: number;
  netIncome: number;
  totalGrowth: number;
  totalClosingBalance: number;
  fundResults: FundYearResult[];
}



@Component({
  selector: 'app-retirement-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './retirement-planning.html',
  styleUrls: ['./retirement-planning.scss']
})
export class RetirementPlanningComponent implements OnInit {
  step = 1;

  // Inputs
  totalCorpus: number = 10000000;
  startAge: number = 60;
  endAge: number = 100;
  inflationRate: number = 6;
  expensesRatio: number = 80; // Placeholder if needed

  funds: FundInput[] = [
    { name: 'Bucket 1 (Cash Flow)', allocationAmount: 5500000, expectedGrowthRate: 6.5, withdrawalRate: 33, taxCategory: 'Debt' },
    { name: 'Bucket 2 (Stability)', allocationAmount: 9000000, expectedGrowthRate: 9.0, withdrawalRate: 0, taxCategory: 'Other' },
    { name: 'Bucket 3 (Growth)', allocationAmount: 13000000, expectedGrowthRate: 11.0, withdrawalRate: 0, taxCategory: 'Equity' },
    { name: 'Bucket 4 (Wealth)', allocationAmount: 18500000, expectedGrowthRate: 12.0, withdrawalRate: 0, taxCategory: 'Equity' }
  ];

  rebalancingRules: RebalancingRule[] = [];


  // Results
  simulationResults: YearResult[] = [];
  selectedYearResult: YearResult | null = null;
  savedPlans: RetirementPlan[] = [];
  planName: string = '';

  constructor(
    private retirementService: RetirementService,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    this.loadSavedPlans();
  }

  loadSavedPlans() {
    this.retirementService.getPlans().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.savedPlans = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading plans', error);
        this.snackbarService.showError('Failed to load saved plans');
      }
    });
  }

  savePlan() {
    const plan: RetirementPlan = {
      name: this.planName || `Plan ${this.savedPlans.length + 1}`,
      start_age: this.startAge,
      end_age: this.endAge,
      inflation_rate: this.inflationRate,
      total_corpus: this.totalCorpus,
      funds: this.funds,
      rebalancing_rules: this.rebalancingRules
    };

    this.retirementService.savePlan(plan).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackbarService.showSuccess('Plan saved successfully');
          this.loadSavedPlans();
        }
      },
      error: (error) => {
        console.error('Error saving plan', error);
        this.snackbarService.showError('Failed to save plan');
      }
    });
  }

  loadPlan(plan: RetirementPlan) {
    this.planName = plan.name;
    this.startAge = plan.start_age;
    this.endAge = plan.end_age;
    this.inflationRate = plan.inflation_rate;
    // this.totalCorpus = plan.total_corpus; // Recalculated anyway
    // Deep copy to avoid reference issues
    this.funds = JSON.parse(JSON.stringify(plan.funds));
    this.rebalancingRules = JSON.parse(JSON.stringify(plan.rebalancing_rules));

    this.step = 1;
    this.calculate();
    this.snackbarService.showSuccess(`Loaded plan: ${plan.name}`);
  }

  deletePlan(id: number | undefined, event: Event) {
    event.stopPropagation();
    if (!id) return;
    if (confirm('Are you sure you want to delete this plan?')) {
      this.retirementService.deletePlan(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.showSuccess('Plan deleted successfully');
            this.loadSavedPlans();
          }
        },
        error: (error) => {
          console.error('Error deleting plan', error);
          this.snackbarService.showError('Failed to delete plan');
        }
      });
    }
  }

  addFund() {
    this.funds.push({ name: 'New Fund', allocationAmount: 0, expectedGrowthRate: 8, withdrawalRate: 0, taxCategory: 'Other' });
  }

  removeFund(index: number) {
    this.funds.splice(index, 1);
  }



  calculate() {
    const totalAllocated = this.funds.reduce((sum, f) => sum + f.allocationAmount, 0);
    this.totalCorpus = totalAllocated;

    this.simulationResults = [];

    // Initialize current balances and cost basis
    let currentBalances = this.funds.map(f => f.allocationAmount);
    let currentCostBasis = this.funds.map(f => f.allocationAmount);
    let currentAnnualWithdrawals = this.funds.map(f => f.allocationAmount * (f.withdrawalRate / 100));



    for (let age = this.startAge; age <= this.endAge; age++) {
      const year = new Date().getFullYear() + (age - this.startAge);
      const isFirstYear = age === this.startAge;

      // Apply inflation to withdrawals from 2nd year onwards
      if (!isFirstYear) {
        currentAnnualWithdrawals = currentAnnualWithdrawals.map(amount => amount * (1 + this.inflationRate / 100));
      }

      const yearResult: YearResult = {
        year: year,
        age: age,
        totalOpeningBalance: 0,
        totalWithdrawal: 0,
        totalTax: 0,
        netIncome: 0,
        totalGrowth: 0,
        totalClosingBalance: 0,
        fundResults: []
      };

      let yearTotalOpening = 0;
      let yearTotalClose = 0;
      let yearTotalWithdrawal = 0;
      let yearTotalGrowth = 0;

      // Tax buckets
      let totalEquityGains = 0;
      let totalDebtGains = 0; // Taxed at slab

      this.funds.forEach((fund, index) => {
        const openingBalance = currentBalances[index];
        if (openingBalance <= 0) {
          yearResult.fundResults.push({
            fundName: fund.name,
            openingBalance: 0,
            totalWithdrawal: 0,
            growth: 0,
            closingBalance: 0,
            monthlyDetails: [],
            rebalancingIn: 0,
            rebalancingOut: 0,
            rateOfReturn: 0,
            logs: []
          });
          return;
        }

        const monthlyGrowthRate = fund.expectedGrowthRate / 100 / 12;

        // Initial Withdrawal Amount for this year (Inflation adjusted)
        const targetAnnualWithdrawal = currentAnnualWithdrawals[index];
        const monthlyWithdrawalAmount = targetAnnualWithdrawal / 12;

        let currentFundBalance = openingBalance;
        let annualWithdrawal = 0;
        let annualGrowth = 0;
        const monthlyDetails: MonthlyDetail[] = [];

        for (let m = 1; m <= 12; m++) {
          const monthOpening = currentFundBalance;
          // Apply Withdrawal
          let withdrawal = monthlyWithdrawalAmount;
          if (withdrawal > monthOpening) {
            withdrawal = monthOpening;
          }

          // Cost Basis Logic for Withdrawal
          // For simplicity, we calculate "Gain Portion" of this monthly withdrawal
          // Gain Ratio = (Balance - Basis) / Balance. 
          // Note: Basis represents the *entire* balance's basis.
          // Basis allocated to this withdrawal = Withdrawal * (Basis / Balance)
          const basisToBalanceRatio = currentCostBasis[index] / (currentFundBalance > 0 ? currentFundBalance : 1);
          const principalComponent = withdrawal * basisToBalanceRatio;
          const gainComponent = withdrawal - principalComponent;

          // Reduce Cost Basis
          currentCostBasis[index] -= principalComponent;
          if (currentCostBasis[index] < 0) currentCostBasis[index] = 0;

          // Aggregate Gains for Tax
          if (gainComponent > 0) {
            if (fund.taxCategory === 'Equity') {
              totalEquityGains += gainComponent;
            } else {
              totalDebtGains += gainComponent;
            }
          }

          const balanceAfterWithdrawal = monthOpening - withdrawal;
          const growth = balanceAfterWithdrawal * monthlyGrowthRate;
          const monthClosing = balanceAfterWithdrawal + growth;

          monthlyDetails.push({
            month: m,
            openingBalance: monthOpening,
            withdrawal: withdrawal,
            growth: growth,
            closingBalance: monthClosing
          });

          annualWithdrawal += withdrawal;
          annualGrowth += growth;
          currentFundBalance = monthClosing;

          if (currentFundBalance < 0.01) currentFundBalance = 0;
        }

        currentBalances[index] = currentFundBalance;

        yearResult.fundResults.push({
          fundName: fund.name,
          openingBalance: openingBalance,
          totalWithdrawal: annualWithdrawal,
          growth: annualGrowth,
          closingBalance: currentFundBalance,
          monthlyDetails: monthlyDetails,
          rebalancingIn: 0,
          rebalancingOut: 0,
          rateOfReturn: (openingBalance > 0) ? (annualGrowth / openingBalance) * 100 : 0,
          logs: []
        });

        yearTotalOpening += openingBalance;
        yearTotalClose += currentFundBalance;
        yearTotalWithdrawal += annualWithdrawal;
        yearTotalGrowth += annualGrowth;
      });

      // Rebalancing Rules Logic (Linear Cascading Approach)
      let baseTotalWithdrawal = currentAnnualWithdrawals.reduce((sum, val) => sum + val, 0);
      let nextYearWithdrawal = baseTotalWithdrawal * (1 + this.inflationRate / 100);
      let yearTwoWithdrawal = nextYearWithdrawal * (1 + this.inflationRate / 100);
      
      let oneYearNeeded = nextYearWithdrawal;
      let twoYearsNeeded = nextYearWithdrawal + yearTwoWithdrawal;

      // Check trigger on Cashflow (Index 0)
      if (this.funds.length > 1 && currentBalances[0] < oneYearNeeded) {
        let deficits = new Array(this.funds.length).fill(0);
        deficits[0] = twoYearsNeeded - currentBalances[0];

        for (let i = 1; i < this.funds.length; i++) {
          let totalDeficit = deficits.reduce((a, b) => a + b, 0);
          if (totalDeficit <= 0.01) break;

          let amountToTake = Math.min(totalDeficit, currentBalances[i]);

          if (amountToTake > 0) {
            let remainingAmount = amountToTake;

            // Distribute to lower funds
            for (let j = 0; j < i; j++) {
              if (deficits[j] > 0.01) {
                let fillAmount = Math.min(deficits[j], remainingAmount);
                if (fillAmount > 0) {
                  // Adjust Cost Basis for i
                  const ratio = currentCostBasis[i] / (currentBalances[i] > 0 ? currentBalances[i] : 1);
                  const principalPart = fillAmount * ratio;
                  const gainPart = fillAmount - principalPart;

                  if (gainPart > 0) {
                    if (this.funds[i].taxCategory === 'Equity') {
                      totalEquityGains += gainPart;
                    } else if (this.funds[i].taxCategory === 'Debt') {
                      totalDebtGains += gainPart;
                    }
                  }

                  currentBalances[i] -= fillAmount;
                  currentCostBasis[i] -= principalPart;

                  currentBalances[j] += fillAmount;
                  currentCostBasis[j] += fillAmount;

                  // Update Results
                  yearResult.fundResults[i].rebalancingOut += fillAmount;
                  yearResult.fundResults[i].closingBalance = currentBalances[i];
                  yearResult.fundResults[i].logs.push({
                    type: 'out',
                    relatedFundName: this.funds[j].name,
                    amount: fillAmount,
                    reason: `Linear Cascade: Top-up ${this.funds[j].name}`
                  });

                  yearResult.fundResults[j].rebalancingIn += fillAmount;
                  yearResult.fundResults[j].closingBalance = currentBalances[j];
                  yearResult.fundResults[j].logs.push({
                    type: 'in',
                    relatedFundName: this.funds[i].name,
                    amount: fillAmount,
                    reason: `Linear Cascade: Top-up from ${this.funds[i].name}`
                  });

                  deficits[j] -= fillAmount;
                  remainingAmount -= fillAmount;
                }
              }
            }
          }

          let remainingTotalDeficit = deficits.reduce((a, b) => a + b, 0);
          if (remainingTotalDeficit > 0.01) {
            // Fund i was completely exhausted, it needs to be topped up to 2 years from next fund
            deficits[i] = twoYearsNeeded;
          }
        }
      } else if (this.funds.length > 1) {
          yearResult.fundResults[0].logs.push({
            type: 'skip',
            relatedFundName: 'Higher Funds',
            reason: `Target > 1 yr expenses. Deferred.`
          });
      }

      // --- TAX CALCULATION (New Regime) ---
      // 1. Equity: 12.5% on gains > 1.25L
      let equityTax = 0;
      if (totalEquityGains > 125000) {
        equityTax = (totalEquityGains - 125000) * 0.125;
      }

      // 2. Debt / Slab Tax
      let slabIncome = totalDebtGains; // Add any other income here if needed
      // Standard Deduction (75k for FY25) - applied if income is salaried/pension. 
      // Assuming these are "Capital Gains" from Debt which simply add to Total Income. 
      // Does Standard Deduction apply to pure Capital Gains income? 
      // Section 16(ia) is for "Salaries". So NO standard deduction for pure investment income.
      // However, for simplified "Retirement" context, usually there is some basic exemption limit.
      // The slabs act as the exemption.

      let slabTax = 0;
      if (slabIncome > 300000) {
        // 3L - 7L: 5%
        if (slabIncome > 700000) {
          slabTax += (700000 - 300000) * 0.05;

          // 7L - 10L: 10%
          if (slabIncome > 1000000) {
            slabTax += (1000000 - 700000) * 0.10;

            // 10L - 12L: 15%
            if (slabIncome > 1200000) {
              slabTax += (1200000 - 1000000) * 0.15;

              // 12L - 15L: 20%
              if (slabIncome > 1500000) {
                slabTax += (1500000 - 1200000) * 0.20;

                // > 15L: 30%
                slabTax += (slabIncome - 1500000) * 0.30;
              } else {
                slabTax += (slabIncome - 1200000) * 0.20;
              }
            } else {
              slabTax += (slabIncome - 1000000) * 0.15;
            }
          } else {
            slabTax += (slabIncome - 700000) * 0.10;
          }
        } else {
          slabTax += (slabIncome - 300000) * 0.05;
          // Section 87A Rebate: If taxable income <= 7L, tax is 0.
          // Note: 87A rebate limit is 25000. 
          // Tax on 7L is 20000 (4L * 5%). 20k < 25k, so rebate applies.
          // So if Slab Income <= 7,00,000, Tax is effectively 0.
          if (slabIncome <= 700000) {
            slabTax = 0;
          }
        }
      }

      const totalTax = equityTax + slabTax;
      const netIncome = yearTotalWithdrawal - totalTax;

      yearResult.totalOpeningBalance = yearTotalOpening;
      yearResult.totalClosingBalance = yearTotalClose;
      yearResult.totalWithdrawal = yearTotalWithdrawal;
      yearResult.totalGrowth = yearTotalGrowth;
      yearResult.totalTax = totalTax;
      yearResult.netIncome = netIncome;

      this.simulationResults.push(yearResult);
    }

    this.step = 2;
    if (this.simulationResults.length > 0) {
      this.selectedYearResult = this.simulationResults[0];
    }
  }

  selectYear(result: YearResult) {
    this.selectedYearResult = result;
  }

  backToInput() {
    this.step = 1;
  }

  getTotalAllocation(): number {
    return this.funds.reduce((acc, curr) => acc + curr.allocationAmount, 0);
  }

  getInitialAnnualWithdrawal(): number {
    return this.funds.reduce((acc, curr) => {
      return acc + (curr.allocationAmount * (curr.withdrawalRate / 100));
    }, 0);
  }

  getInitialMonthlyWithdrawal(): number {
    // Shows the projected monthly withdrawal for the FIRST year based on initial allocation
    return this.funds.reduce((acc, curr) => {
      const initialAnnualWithdrawal = curr.allocationAmount * (curr.withdrawalRate / 100);
      return acc + (initialAnnualWithdrawal / 12);
    }, 0);
  }

  getMonthlyAggregate(monthIndex: number, field: 'withdrawal' | 'closingBalance'): number {
    if (!this.selectedYearResult) return 0;
    return this.selectedYearResult.fundResults.reduce((sum, fundRes) => {
      const detail = fundRes.monthlyDetails[monthIndex];
      return sum + (detail ? detail[field] : 0);
    }, 0);
  }
}
