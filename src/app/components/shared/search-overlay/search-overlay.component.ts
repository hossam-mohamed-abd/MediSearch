import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DrugCardComponent, Drug } from '../drug-card/drug-card.component';

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [FormsModule, DrugCardComponent],
  templateUrl: './search-overlay.component.html',
  styleUrl: './search-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchOverlayComponent implements OnInit, AfterViewInit, OnDestroy {

  // بنستقبل مكان الـ search bar في الـ hero عشان نعمل FLIP
  @Input() heroSearchRect: DOMRect | null = null;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('overlaySearchRef') overlaySearchRef!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  searchQuery = '';
  isVisible = false;   // controls fade-in of the backdrop + results
  isAnimating = false; // while FLIP is playing

  // ── Static drug data ────────────────────────────────────────
  private allDrugs: Drug[] = [
    {
      id: 1, name: 'Panadol Extra 500mg', active_substance: 'Paracetamol',
      dosage_form: 'Tablet', strength: '500mg', manufacturer: 'GSK',
      category_name: 'Pain Relief', min_price: 35, pharmacy_count: 12,
      alternatives_count: 3, is_available: true, is_favorite: false,
      image_url: '',
    },
    {
      id: 2, name: 'Augmentin 625mg', active_substance: 'Amoxicillin/Clavulanate',
      dosage_form: 'Tablet', strength: '625mg', manufacturer: 'GSK',
      category_name: 'Antibiotics', min_price: 120, pharmacy_count: 8,
      alternatives_count: 2, is_available: true, is_favorite: false,
      image_url: '',
    },
    {
      id: 3, name: 'Brufen 400mg', active_substance: 'Ibuprofen',
      dosage_form: 'Tablet', strength: '400mg', manufacturer: 'Abbott',
      category_name: 'Pain Relief', min_price: 28, pharmacy_count: 15,
      alternatives_count: 4, is_available: false, is_favorite: false,
      image_url: '',
    },
    {
      id: 4, name: 'Glucophage 500mg', active_substance: 'Metformin',
      dosage_form: 'Tablet', strength: '500mg', manufacturer: 'Merck',
      category_name: 'Diabetes', min_price: 45, pharmacy_count: 10,
      alternatives_count: 2, is_available: true, is_favorite: true,
      image_url: '',
    },
    {
      id: 5, name: 'Nexium 40mg', active_substance: 'Esomeprazole',
      dosage_form: 'Tablet', strength: '40mg', manufacturer: 'AstraZeneca',
      category_name: 'Gastric', min_price: 95, pharmacy_count: 7,
      alternatives_count: 3, is_available: true, is_favorite: false,
      image_url: '',
    },
    {
      id: 6, name: 'Concor 5mg', active_substance: 'Bisoprolol',
      dosage_form: 'Tablet', strength: '5mg', manufacturer: 'Merck',
      category_name: 'Cardiology', min_price: 60, pharmacy_count: 9,
      alternatives_count: 1, is_available: true, is_favorite: false,
      image_url: '',
    },
    {
      id: 7, name: 'Amoxil 500mg', active_substance: 'Amoxicillin',
      dosage_form: 'Capsule', strength: '500mg', manufacturer: 'GSK',
      category_name: 'Antibiotics', min_price: 55, pharmacy_count: 14,
      alternatives_count: 5, is_available: true, is_favorite: false,
      image_url: '',
    },
    {
      id: 8, name: 'Ventolin Syrup', active_substance: 'Salbutamol',
      dosage_form: 'Syrup', strength: '2mg/5ml', manufacturer: 'GSK',
      category_name: 'Respiratory', min_price: 40, pharmacy_count: 6,
      alternatives_count: 2, is_available: false, is_favorite: false,
      image_url: '',
    },
  ];

  filteredDrugs: Drug[] = [];

  private keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.filteredDrugs = [...this.allDrugs];
    document.addEventListener('keydown', this.keydownHandler);
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    this.playFLIP();
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    document.body.style.overflow = '';
  }

  // ── FLIP animation ──────────────────────────────────────────
  private playFLIP(): void {
    if (!this.heroSearchRect || !this.overlaySearchRef) {
      // no source rect — just fade in normally
      this.isVisible = true;
      this.cdr.markForCheck();
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 300);
      return;
    }

    const target = this.overlaySearchRef.nativeElement;
    const targetRect = target.getBoundingClientRect();

    // Delta between hero search bar and overlay search bar
    const dx = this.heroSearchRect.left - targetRect.left;
    const dy = this.heroSearchRect.top  - targetRect.top;
    const scaleX = this.heroSearchRect.width  / targetRect.width;
    const scaleY = this.heroSearchRect.height / targetRect.height;

    // Start from hero position
    target.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    target.style.transformOrigin = 'top left';
    target.style.transition = 'none';
    target.style.opacity = '1';

    this.isAnimating = true;
    this.isVisible = false;
    this.cdr.markForCheck();

    // Force reflow then animate to final position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.15, 0.64, 1), opacity 0.3s ease';
        target.style.transform  = 'translate(0, 0) scale(1)';

        // Fade in backdrop + results
        setTimeout(() => {
          this.isVisible   = true;
          this.isAnimating = false;
          this.cdr.markForCheck();
          this.searchInputRef?.nativeElement.focus();
        }, 200);
      });
    });
  }

  // ── Search filter ───────────────────────────────────────────
  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredDrugs = q
      ? this.allDrugs.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.active_substance.toLowerCase().includes(q) ||
          d.manufacturer.toLowerCase().includes(q) ||
          (d.category_name ?? '').toLowerCase().includes(q)
        )
      : [...this.allDrugs];
    this.cdr.markForCheck();
  }

  // ── Close ───────────────────────────────────────────────────
  close(): void {
    this.isVisible = false;
    this.cdr.markForCheck();

    if (this.heroSearchRect && this.overlaySearchRef) {
      const target = this.overlaySearchRef.nativeElement;
      const targetRect = target.getBoundingClientRect();
      const dx = this.heroSearchRect.left - targetRect.left;
      const dy = this.heroSearchRect.top  - targetRect.top;
      const scaleX = this.heroSearchRect.width  / targetRect.width;
      const scaleY = this.heroSearchRect.height / targetRect.height;

      target.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease';
      target.style.transform  = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
      target.style.opacity    = '0';

      setTimeout(() => this.closed.emit(), 460);
    } else {
      setTimeout(() => this.closed.emit(), 300);
    }
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('search-overlay__backdrop')) {
      this.close();
    }
  }

  onFavoriteToggle(drug: Drug): void {
    drug.is_favorite = !drug.is_favorite;
    this.cdr.markForCheck();
  }

  onDrugClick(drug: Drug): void {
    // navigate to drug detail later
    console.log('Drug clicked:', drug.name);
  }
}