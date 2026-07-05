import { Injectable } from '@angular/core';
import { Drug } from '../../components/shared/drug-card/drug-card.component';

/**
 * Keeps the search overlay's last state alive across open/close cycles.
 * The overlay component gets destroyed every time it's closed (it's an @if
 * in the navbar), so without this service every reopen would start from scratch.
 */
@Injectable({
  providedIn: 'root',
})
export class SearchOverlayStateService {
  query = '';
  drugs: Drug[] = [];
  total = 0;
  hasMore = false;
  page = 1;

  save(query: string, drugs: Drug[], total: number, hasMore: boolean, page: number): void {
    this.query = query;
    this.drugs = drugs;
    this.total = total;
    this.hasMore = hasMore;
    this.page = page;
  }

  updateQuery(query: string): void {
    this.query = query;
  }

  clear(): void {
    this.query = '';
    this.drugs = [];
    this.total = 0;
    this.hasMore = false;
    this.page = 1;
  }
}
