import { Component, OnInit, inject } from '@angular/core';
import { StatisticsService } from '../../../../core/services/statistics.service';
@Component({
  selector: 'app-statistics',
  imports: [],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css',
})
export class StatisticsComponent implements OnInit {
  private statisticsService = inject(StatisticsService);

  medicinesCount = 0;
  pharmaciesCount = 0;

  ngOnInit() {
    this.loadStatistics();
  }

  private loadStatistics() {
    this.statisticsService.getStatistics().subscribe({
      next: (res) => {
        this.medicinesCount = res.data.medicinesCount;

        this.pharmaciesCount = res.data.pharmaciesCount;
      },
    });
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + 'M+';
    }

    if (value >= 1000) {
      return (value / 1000).toFixed(1).replace('.0', '') + 'K+';
    }

    return value.toString();
  }
}
