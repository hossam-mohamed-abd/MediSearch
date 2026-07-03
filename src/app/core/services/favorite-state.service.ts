import { Injectable, signal } from '@angular/core';
import { Drug } from '../../components/shared/drug-card/drug-card.component';

@Injectable({
  providedIn: 'root',
})
export class FavoriteStateService {
  favoriteCount = signal(0);

  favorites = signal<Drug[]>([]);

  setFavorites(drugs: Drug[]) {
    this.favorites.set(drugs);
    this.favoriteCount.set(drugs.length);
  }

  addFavorite(drug: Drug) {
    const exists = this.favorites().some((d) => d.id === drug.id);

    if (exists) return;

    this.favorites.update((list) => [drug, ...list]);

    this.favoriteCount.update((c) => c + 1);
  }

  removeFavorite(drugId: number) {
    this.favorites.update((list) => list.filter((d) => d.id !== drugId));

    this.favoriteCount.update((c) => Math.max(0, c - 1));
  }

  clear() {
    this.favorites.set([]);
    this.favoriteCount.set(0);
  }
}
