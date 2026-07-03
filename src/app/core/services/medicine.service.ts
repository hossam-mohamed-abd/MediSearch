import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FeaturedMedicinesResponse } from '../models/drug.model';
@Injectable({
  providedIn: 'root'
})
export class MedicineService {

  private http = inject(HttpClient);

  private api =
    `${environment.apiUrl}/home/medicines`;

  getFeaturedMedicines(page: number) {
    return this.http.get<FeaturedMedicinesResponse>(
      `${this.api}/featured?page=${page}`
    );
  }
}