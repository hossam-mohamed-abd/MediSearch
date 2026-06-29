import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(data: any) {
    return this.http.post(`${this.api}/auth/login`, data, {
      withCredentials: true,
    });
  }

  register(data: any) {
    return this.http.post(`${this.api}/auth/register`, data, {
      withCredentials: true,
    });
  }

  profile() {
    return this.http.get(`${this.api}/auth/profile`, {
      withCredentials: true,
    });
  }

  logout() {
    return this.http.post(
      `${this.api}/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  getCountries() {
    return this.http.get(`${this.api}/countries`);
  }

  getGovernorates(countryId: number) {
    return this.http.get(`${this.api}/governorates/${countryId}`);
  }

  getCities(governorateId: number) {
    return this.http.get(`${this.api}/cities/${governorateId}`);
  }

  checkEmail(email: string): Observable<any> {
    return this.http.post(`${this.api}/auth/check-email`, { email });
  }
}
