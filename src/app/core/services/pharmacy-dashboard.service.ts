import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PharmacyDashboardService {

  private http = inject(HttpClient);

  private api =
    `${environment.apiUrl}/pharmacy`;

  uploadInventory(file: File) {

    const formData = new FormData();

    formData.append(
      'file',
      file,
    );

    return this.http.post(
      `${this.api}/upload`,
      formData,
      {
        withCredentials: true,
      },
    );
  }

  getProfile() {

    return this.http.get<any>(
      `${this.api}/profile`,
      {
        withCredentials: true,
      },
    );

  }

  updateProfile(data: any) {

    return this.http.put(
      `${this.api}/profile`,
      data,
      {
        withCredentials: true,
      },
    );

  }

}