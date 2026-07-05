import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DrugDetail {
  id: string;
  name: string;
  activeSubstance: string | null;
  dosageForm: string | null;
  strength: string | null;
  manufacturer: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryName: string | null;
}

export interface PharmacyOffer {
  pharmacyId: string;
  name: string;
  price: number | null;
  quantity: number | null;
  rating: number | null;
  ratingCount: number;
  address: string | null;
  cityName: string | null;
  governorateName: string | null;
  countryName: string | null;
  proximityTier: 'same_city' | 'same_governorate' | 'same_country' | 'other';
}

export interface DrugDetailResponse {
  success: boolean;
  drug: DrugDetail;
  pharmacies: PharmacyOffer[];
}

@Injectable({ providedIn: 'root' })
export class MedicineDetailService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/drugs`;

  getDetail(id: string | number) {
    return this.http.get<DrugDetailResponse>(`${this.api}/${id}`);
  }
}