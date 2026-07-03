import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PharmacyService {

  private http = inject(HttpClient);

  private api =
    `${environment.apiUrl}/home/pharmacies`;

  getPharmacies(page: number) {
    return this.http.get<any>(
      `${this.api}?page=${page}`
    );
  }
}