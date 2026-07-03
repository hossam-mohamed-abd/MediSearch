import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PharmacyService {
  private http = inject(HttpClient);

  private api = `${environment.apiUrl}/home/pharmacies`;

  getPharmacies(page: number) {
    return this.http.get<any>(`${this.api}?page=${page}`);
  }

  getPharmacy(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  getMedicines(
    pharmacyId: number,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      category?: number | null;
      available?: boolean;
    },
  ) {
    let params = new HttpParams().set('page', options.page ?? 1).set('limit', options.limit ?? 12);

    if (options.search) {
      params = params.set('search', options.search);
    }

    if (options.category) {
      params = params.set('category', options.category);
    }

    if (options.available) {
      params = params.set('available', 'true');
    }

    return this.http.get<any>(`${this.api}/${pharmacyId}/medicines`, {
      params,
    });
  }

  getCategories(pharmacyId: number) {
    return this.http.get<any>(`${this.api}/${pharmacyId}/categories`);
  }

  getReviews(pharmacyId: number, page = 1) {
    return this.http.get<any>(`${this.api}/${pharmacyId}/reviews`, {
      params: {
        page,
      },
    });
  }
}
