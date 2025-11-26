import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit {
  goals = [
    {
      name: 'Retirement Fund',
      targetDate: '2045',
      progress: 35,
      current: 850000,
      target: 2500000,
      monthlySip: 15000
    },
    {
      name: 'House Purchase',
      targetDate: '2028',
      progress: 60,
      current: 1200000,
      target: 2000000,
      monthlySip: 20000
    },
    {
      name: 'Emergency Fund',
      targetDate: '2025',
      progress: 80,
      current: 400000,
      target: 500000,
      monthlySip: 5000
    }
  ];

  ngOnInit() { }
}