import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

interface FundInput {
  name: string;
  allocationAmount: number;
  expectedGrowthRate: number;
  withdrawalRate: number; // Percentage
  taxCategory: 'Equity' | 'Debt' | 'Other';
}

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

interface RebalancingRule {
  sourceFundIndex: number;
  destinationFundIndex: number;
  amount: number;
  percentageAmount?: number;
  frequency: number;
}

@Component({
  selector: 'app-retirement-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './retirement-planning.html',
  styleUrls: ['./retirement-planning.scss']
})
export class RetirementPlanningComponent {
  step = 1;

  // Inputs
  totalCorpus: number = 10000000;
  startAge: number = 60;
  endAge: number = 100;
  inflationRate: number = 6;
  expensesRatio: number = 80; // Placeholder if needed

  funds: FundInput[] = [
    { name: 'Equity Fund', allocationAmount: 6000000, expectedGrowthRate: 12, withdrawalRate: 4, taxCategory: 'Equity' },
    { name: 'Debt Fund', allocationAmount: 4000000, expectedGrowthRate: 7, withdrawalRate: 5, taxCategory: 'Debt' }
  ];

  rebalancingRules: RebalancingRule[] = [];

  // Results
  simulationResults: YearResult[] = [];
  selectedYearResult: YearResult | null = null;

  addFund() {
    this.funds.push({ name: 'New Fund', allocationAmount: 0, expectedGrowthRate: 8, withdrawalRate: 0, taxCategory: 'Other' });
  }

  removeFund(index: number) {
    this.funds.splice(index, 1);
  }

  addRebalancingRule() {
    this.rebalancingRules.push({
      sourceFundIndex: 0,
      destinationFundIndex: 1,
      amount: 0,
      percentageAmount: 10,
      frequency: 1
    });
  }

  removeRebalancingRule(index: number) {
    this.rebalancingRules.splice(index, 1);
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
            monthlyDetails: []
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
          monthlyDetails: monthlyDetails
        });

        yearTotalOpening += openingBalance;
        yearTotalClose += currentFundBalance;
        yearTotalWithdrawal += annualWithdrawal;
        yearTotalGrowth += annualGrowth;
      });

      // Rebalancing Rules Logic (Source to Destination)
      const yearIndex = age - this.startAge + 1;

      this.rebalancingRules.forEach(rule => {
        if (rule.frequency > 0 && yearIndex % rule.frequency === 0) {
          const sourceIdx = rule.sourceFundIndex;
          const destIdx = rule.destinationFundIndex;

          if (sourceIdx >= 0 && sourceIdx < currentBalances.length && destIdx >= 0 && destIdx < currentBalances.length && sourceIdx !== destIdx) {
            let amountToTransfer = 0;

            if (rule.percentageAmount && rule.percentageAmount > 0) {
              // Calculate based on current balance of source fund
              amountToTransfer = currentBalances[sourceIdx] * (rule.percentageAmount / 100);
            } else {
              amountToTransfer = rule.amount;
            }

            // Helper: Check if source has enough funds
            if (currentBalances[sourceIdx] < amountToTransfer) {
              amountToTransfer = currentBalances[sourceIdx];
            }

            if (amountToTransfer > 0) {
              // Adjust Cost Basis before transfer
              // When moving Capital from Source, we carry pro-rata cost basis OUT of Source
              // But we treat it as NEW Investment (Principal) INTO Destination
              // This resets the "Gain" clock for the destination?
              // YES: Tax event happens on switch. Technically STP = Redemption + Investment.
              // So we should calculate TAX on this switch too!
              // For simplicity in this version, let's assume "Cost Basis Transfer" without Tax Event?
              // User requirement: "Yearly Wise Projections...". 
              // Real world: Switch IS taxable.
              // Let's implement TAX ON SWITCH.

              const ratio = currentCostBasis[sourceIdx] / (currentBalances[sourceIdx] > 0 ? currentBalances[sourceIdx] : 1);
              const principalPart = amountToTransfer * ratio;
              const gainPart = amountToTransfer - principalPart;

              // Tax the gain
              if (gainPart > 0) {
                if (this.funds[sourceIdx].taxCategory === 'Equity') {
                  totalEquityGains += gainPart;
                } else {
                  totalDebtGains += gainPart;
                }
              }

              currentBalances[sourceIdx] -= amountToTransfer;
              currentCostBasis[sourceIdx] -= principalPart;

              currentBalances[destIdx] += amountToTransfer;
              currentCostBasis[destIdx] += amountToTransfer; // Full amount enters as new principal
            }
          }
        }
      });

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
