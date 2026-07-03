import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private http = inject(HttpClient);

  search(query: string, page = 1, limit = 6) {
    let params = new HttpParams().set('q', query).set('page', page).set('limit', limit);

    return this.http.get<any>(`${environment.apiUrl}/search`, { params });
  }
}
