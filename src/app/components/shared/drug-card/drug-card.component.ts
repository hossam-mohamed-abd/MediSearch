import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state';
import { FavoriteFlyService } from '../../../core/services/favorite-fly.service';

export interface Drug {
  id: number;
  name: string;
  active_substance: string;
  dosage_form: string;
  strength: string;
  manufacturer: string;
  description?: string;
  image_url?: string;
  category_name?: string;
  min_price?: number;
  pharmacy_count?: number;
  alternatives_count?: number;
  is_available?: boolean;
  is_favorite?: boolean;
}

const DEFAULT_DRUG_IMAGE =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRAB9GcDNaBRXCaGI-KcOW0Ci21Zc_5KzQnVxkq9-4RA&s=10';

@Component({
  selector: 'app-drug-card',
  standalone: true,
  imports: [],
  templateUrl: './drug-card.component.html',
  styleUrl: './drug-card.component.css',
})
export class DrugCardComponent {

  @Input() drug!: Drug;
  @Output() favoriteToggled = new EventEmitter<Drug>();
  @Output() cardClicked     = new EventEmitter<Drug>();

  imageError = false;

  private authState = inject(AuthStateService);
  private favoriteFlyService = inject(FavoriteFlyService);

  constructor(private router: Router) {}

  get displayImage(): string {
    return this.drug.image_url || DEFAULT_DRUG_IMAGE;
  }

  onImageError(): void {
    this.imageError = true;
  }

  onFavoriteClick(event: MouseEvent): void {
    event.stopPropagation();

    const willBeFavorite = !this.drug.is_favorite;

    // Only play the animation when the user is actually logged in and
    // the drug is about to be added (not removed) — otherwise the
    // auth modal will show instead and there's nothing to celebrate.
    if (willBeFavorite && this.authState.isLoggedIn()) {
      const btn = event.currentTarget as HTMLElement;
      this.triggerLocalPop(btn);
      this.favoriteFlyService.fly(btn);
    }

    this.favoriteToggled.emit(this.drug);
  }

  private triggerLocalPop(btn: HTMLElement): void {
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 420);
  }

  onCardClick(): void {
    this.cardClicked.emit(this.drug);
  }

  onAiClick(event: MouseEvent): void {
    event.stopPropagation();
    const query = `Tell me about ${this.drug.name} (${this.drug.active_substance}) — uses, dosage, side effects, and alternatives.`;
    this.router.navigate(['/ai-assistant'], { queryParams: { q: query } });
  }
}