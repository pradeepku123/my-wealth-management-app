import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecommendationsService } from '../../services/recommendations.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-fund-details',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './fund-details.component.html',
    styleUrls: ['./fund-details.component.scss']
})
export class FundDetailsComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
    @ViewChild('navChart') navChartCanvas!: ElementRef<HTMLCanvasElement>;

    @Input() schemeCodeInput: string | null = null;
    @Input() showBackLink: boolean = true;

    schemeCode: string | null = null;
    fundData: any = null;
    isLoading = true;
    error: string | null = null;
    chart: Chart | null = null;
    highLowStats: any = null;
    statsTitle: string = 'All-Time High/Low';

    timeRanges = ['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'All'];
    selectedRange = 'All';

    constructor(
        private route: ActivatedRoute,
        private recommendationsService: RecommendationsService
    ) { }

    ngOnInit(): void {
        // If input is provided, use it. Otherwise check route.
        if (this.schemeCodeInput) {
            this.schemeCode = this.schemeCodeInput;
        } else {
            this.schemeCode = this.route.snapshot.paramMap.get('schemeCode');
        }

        if (this.schemeCode) {
            this.fetchFundDetails(this.schemeCode);
        } else {
            // Only show error if we are supposed to have a code (e.g. routed)
            // If used as a component without input initially, it might wait for changes
            if (!this.schemeCodeInput) {
                this.error = 'Invalid Scheme Code';
                this.isLoading = false;
            }
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['schemeCodeInput'] && changes['schemeCodeInput'].currentValue) {
            this.schemeCode = changes['schemeCodeInput'].currentValue;
            if (this.schemeCode) {
                this.fetchFundDetails(this.schemeCode);
            }
        }
    }

    ngAfterViewInit(): void {
        // Chart will be initialized after data load
    }

    ngOnDestroy(): void {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    fetchFundDetails(code: string): void {
        this.isLoading = true;
        this.recommendationsService.getFundDetails(code).subscribe({
            next: (data) => {
                this.fundData = data;
                this.isLoading = false;
                this.calculateHighLowStats();
                setTimeout(() => this.initChart(), 0); // Init chart after view update
            },
            error: (err) => {
                this.error = 'Failed to load fund details';
                this.isLoading = false;
                console.error(err);
            }
        });
    }



    calculateHighLowStats(): void {
        const filteredData = this.getFilteredData();

        if (!filteredData || filteredData.length === 0) return;

        // Update title based on selection
        switch (this.selectedRange) {
            case 'All': this.statsTitle = 'All-Time High/Low'; break;
            case '1W': this.statsTitle = '1-Week High/Low'; break;
            case '1M': this.statsTitle = '1-Month High/Low'; break;
            case '3M': this.statsTitle = '3-Month High/Low'; break;
            case '6M': this.statsTitle = '6-Month High/Low'; break;
            case '1Y': this.statsTitle = '1-Year High/Low'; break;
            case '3Y': this.statsTitle = '3-Year High/Low'; break;
            case '5Y': this.statsTitle = '5-Year High/Low'; break;
            default: this.statsTitle = `${this.selectedRange} High/Low`;
        }

        const currentNav = parseFloat(filteredData[filteredData.length - 1].nav);

        let highNav = -Infinity;
        let lowNav = Infinity;

        filteredData.forEach((d: any) => {
            const nav = parseFloat(d.nav);
            if (nav > highNav) highNav = nav;
            if (nav < lowNav) lowNav = nav;
        });

        this.highLowStats = {
            currentNav: currentNav,
            high: highNav,
            low: lowNav,
            highDiff: currentNav - highNav,
            highDiffPercent: highNav !== 0 ? ((currentNav - highNav) / highNav) * 100 : 0,
            lowDiff: currentNav - lowNav,
            lowDiffPercent: lowNav !== 0 ? ((currentNav - lowNav) / lowNav) * 100 : 0
        };
    }

    onRangeSelect(range: string): void {
        this.selectedRange = range;
        this.updateChartData();
        this.calculateHighLowStats();
    }

    getFilteredData(): any[] {
        if (!this.fundData || !this.fundData.data) return [];

        // Sort data chronologically first
        const sortedData = [...this.fundData.data].sort((a: any, b: any) => {
            const dateA = this.parseDate(a.date);
            const dateB = this.parseDate(b.date);
            return dateA.getTime() - dateB.getTime();
        });

        if (this.selectedRange === 'All') {
            return sortedData;
        }

        const endDate = this.parseDate(sortedData[sortedData.length - 1].date);
        let startDate = new Date(endDate);

        switch (this.selectedRange) {
            case '1W':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '1M':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case '3M':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case '6M':
                startDate.setMonth(endDate.getMonth() - 6);
                break;
            case '1Y':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            case '3Y':
                startDate.setFullYear(endDate.getFullYear() - 3);
                break;
            case '5Y':
                startDate.setFullYear(endDate.getFullYear() - 5);
                break;
        }

        return sortedData.filter((d: any) => {
            const date = this.parseDate(d.date);
            return date >= startDate;
        });
    }

    updateChartData(): void {
        if (!this.chart) return;

        const filteredData = this.getFilteredData();
        const labels = filteredData.map((d: any) => d.date);
        const dataPoints = filteredData.map((d: any) => parseFloat(d.nav));

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = dataPoints;
        this.chart.update();
    }

    initChart(): void {
        if (!this.fundData || !this.fundData.data || !this.navChartCanvas) return;

        const ctx = this.navChartCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const filteredData = this.getFilteredData();
        const labels = filteredData.map((d: any) => d.date);
        const dataPoints = filteredData.map((d: any) => parseFloat(d.nav));

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'NAV',
                    data: dataPoints,
                    borderColor: '#4f46e5',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 0, // Hide points for cleaner look on large datasets
                    pointHoverRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    parseDate(dateStr: string): Date {
        const [day, month, year] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
}
