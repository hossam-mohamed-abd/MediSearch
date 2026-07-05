import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MedicineDetailService, DrugDetail, PharmacyOffer } from '../../../core/services/medicine-detail.service';
import { AiChatBridgeService } from '../../../core/services/ai-chat-bridge.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { FavoriteStateService } from '../../../core/services/favorite-state.service';
import { AuthStateService } from '../../../core/services/auth-state';
import { FavoriteFlyService } from '../../../core/services/favorite-fly.service';
import { AiChatComponent } from "../../ai-assistan/ai-assistan.component";

@Component({
  selector: 'app-medicine-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, AiChatComponent],
  templateUrl: './medicine-detail.component.html',
  styleUrl: './medicine-detail.component.css',
})
export class MedicineDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(MedicineDetailService);
  private aiChat = inject(AiChatBridgeService);
  private favSvc = inject(FavoriteService);
  private favState = inject(FavoriteStateService);
  private authState = inject(AuthStateService);
  private favFlyService = inject(FavoriteFlyService);

  drug = signal<DrugDetail | null>(null);
  pharmacies = signal<PharmacyOffer[]>([]);
  loading = signal(true);
  imageError = signal(false);
  isFavorite = signal(false);
  activeTab = signal<'pharmacies' | 'info'>('pharmacies');

  readonly DEFAULT_IMAGE =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRAB9GcDNaBRXCaGI-KcOW0Ci21Zc_5KzQnVxkq9-4RA&s=10';

  minPrice = computed(() => {
    const prices = this.pharmacies()
      .map((p) => p.price)
      .filter((p): p is number => p !== null);
    return prices.length ? Math.min(...prices) : null;
  });

  availableCount = computed(() => this.pharmacies().filter((p) => (p.quantity ?? 0) > 0).length);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/medicines']);
      return;
    }

    // نشوف لو الدواء ده موجود في المفضلة أصلاً
    this.isFavorite.set(this.favState.favorites().some((f) => f.id === Number(id)));

    this.load(id);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.service.getDetail(id).subscribe({
      next: (res) => {
        this.drug.set(res.drug);
        this.pharmacies.set(res.pharmacies);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/medicines']);
      },
    });
  }

  get displayImage(): string {
    return this.drug()?.imageUrl || this.DEFAULT_IMAGE;
  }

  onImageError(): void {
    this.imageError.set(true);
  }

  // ── AI ────────────────────────────────────────────────────────────────────

  onAskAi(): void {
    const d = this.drug();
    if (!d) return;

    const q = `احكيلي عن ${d.name} (${d.activeSubstance}) — الاستخدامات، الجرعة، الأضرار، والبدائل.`;
    this.aiChat.askAbout(q);
  }

  // ── Favorite ──────────────────────────────────────────────────────────────

  onToggleFavorite(event: MouseEvent): void {
    if (!this.authState.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const d = this.drug();
    if (!d) return;

    const drugId = Number(d.id);
    const willBeFavorite = !this.isFavorite();

    // تشغيل أنيميشن الـ fly لو بيتضاف
    if (willBeFavorite) {
      const btn = event.currentTarget as HTMLElement;
      this.triggerLocalPop(btn);
      this.favFlyService.fly(btn);
    }

    // optimistic update
    this.isFavorite.set(willBeFavorite);

    this.favSvc.toggle(drugId).subscribe({
      next: (res) => {
        this.isFavorite.set(res.isFavorite);

        // نزود أو نشيل من الـ global state
        if (res.isFavorite) {
          this.favState.addFavorite({
            id: drugId,
            name: d.name,
            active_substance: d.activeSubstance ?? '',
            dosage_form: d.dosageForm ?? '',
            strength: d.strength ?? '',
            manufacturer: d.manufacturer ?? '',
            image_url: d.imageUrl ?? '',
            is_favorite: true,
          });
        } else {
          this.favState.removeFavorite(drugId);
        }
      },
      error: () => {
        // rollback لو فشل
        this.isFavorite.set(!willBeFavorite);
      },
    });
  }

  private triggerLocalPop(btn: HTMLElement): void {
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 420);
  }

  // ── Tabs & Navigation ─────────────────────────────────────────────────────

  getTierLabel(tier: PharmacyOffer['proximityTier']): string {
    const map = {
      same_city: 'Your City',
      same_governorate: 'Your Governorate',
      same_country: 'Same Country',
      other: 'Other',
    };
    return map[tier];
  }

  getTierClass(tier: PharmacyOffer['proximityTier']): string {
    return `tier--${tier.replace(/_/g, '-')}`;
  }

  setTab(tab: 'pharmacies' | 'info'): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.router.navigate(['/medicines']);
  }
}
