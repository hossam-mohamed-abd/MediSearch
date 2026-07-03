import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private http = inject(HttpClient);

  private api =
    `${environment.apiUrl}/home/statistics`;

  getStatistics() {
    return this.http.get<any>(this.api);
  }
}