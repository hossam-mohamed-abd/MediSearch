import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private api = environment.apiUrl;

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
}
