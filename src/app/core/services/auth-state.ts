import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'ms_user';

@Injectable({ providedIn: 'root' })
export class AuthStateService {

  // بنقرأ من localStorage فوراً عند تحميل الـ service
  private userSubject = new BehaviorSubject<any>(this.loadFromStorage());

  user$      = this.userSubject.asObservable();

  setUser(user: any) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
    this.userSubject.next(user);
  }

  clearUser() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    this.userSubject.next(null);
  }

  getUser() {
    return this.userSubject.value;
  }

  isLoggedIn() {
    return !!this.userSubject.value;
  }

  private loadFromStorage(): any {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}