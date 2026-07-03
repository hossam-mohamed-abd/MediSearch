import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private http = inject(HttpClient);

  private api = `${environment.apiUrl}/favorites`;

  toggle(drugId: number) {
    console.log('drugId', drugId);
    return this.http.post<{
      success: boolean;
      isFavorite: boolean;
    }>(
      this.api,
      {
        drugId,
      },
      {
        withCredentials: true,
      },
    );
  }

  count() {
    return this.http.get<{
      success: boolean;
      count: number;
    }>(`${this.api}/count`, {
      withCredentials: true,
    });
  }

  getFavorites() {
    return this.http.get<any>(`${this.api}`, {
      withCredentials: true,
    });
  }
}
