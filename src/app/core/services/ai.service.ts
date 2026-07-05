import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface MedicineCard {
  name: string;
  activeSubstance: string | null;
  dosageForm: string | null;
  strength: string | null;
  pros: string[];
  cons: string[];
}

export interface AlternativeCard extends MedicineCard {
  reason: string | null;
}

export interface PharmacyLocation {
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  placeId: string | null;
  mapsUrl: string;
  staticMapUrl: string;
}

export type PharmaciesUnavailableReason = 'no_city' | 'not_found' | 'error' | null;

export interface AiChatResponse {
  success: boolean;
  messages: string[];
  medicineCard: MedicineCard | null;
  alternativeCard: AlternativeCard | null;
  searchQuery: string | null;
  nearbyPharmacies: PharmacyLocation[] | null;
  pharmaciesUnavailableReason: PharmaciesUnavailableReason;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);

  chat(message: string, history: ChatMessage[]) {
    return this.http.post<AiChatResponse>(
      `${environment.apiUrl}/ai/chat`,
      { message, history },
      { withCredentials: true },
    );
  }
}
