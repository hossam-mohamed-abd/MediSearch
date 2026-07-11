import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PharmacyAuthService {
  private http = inject(HttpClient);

  private api = `${environment.apiUrl}/pharmacy-auth`;

  login(data: any) {
    return this.http.post(
      `${this.api}/login`,
      data,
      {
        withCredentials: true,
      },
    );
  }

  profile() {
    return this.http.get(
      `${this.api}/profile`,
      {
        withCredentials: true,
      },
    );
  }

  logout() {
    return this.http.post(
      `${this.api}/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }
  private api1 = `${environment.apiUrl}/pharmacy`;
  getDashboard() {
    return this.http.get(
      `${this.api1}/dashboard`,
      {
        withCredentials: true,
      },
    );
  }

  uploadInventory(file: File) {

    const formData = new FormData();

    formData.append(
      'file',
      file
    );

    return this.http.post(
      `${this.api1}/upload`,
      formData,
      {
        withCredentials: true,
      },
    );
  }
}