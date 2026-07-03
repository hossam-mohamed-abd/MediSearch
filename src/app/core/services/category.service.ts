import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HomeCategoriesResponse } from '../models/home-categories-response';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private http = inject(HttpClient);

  private api =
    `${environment.apiUrl}/categories`;

  getHomeCategories() {
    return this.http.get<HomeCategoriesResponse>(
      `${this.api}/home`
    );
  }
}