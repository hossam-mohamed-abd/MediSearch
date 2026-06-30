import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchOverlayComponent } from '../../../shared/search-overlay/search-overlay.component'; 

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, SearchOverlayComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent implements OnInit, OnDestroy {

  // Reference to the search bar element in hero
  @ViewChild('heroSearchInner') heroSearchInnerRef!: ElementRef<HTMLDivElement>;

  searchAnimating = false;
  searchReturning = false;
  showHint        = false;
  showSearchOverlay = false;

  // We capture the rect BEFORE the overlay opens so FLIP knows the source
  heroSearchRect: DOMRect | null = null;

  private timers: any[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.timers.push(setTimeout(() => {
      this.searchAnimating = true;
      this.cdr.markForCheck();

      this.timers.push(setTimeout(() => {
        this.searchAnimating = false;
        this.searchReturning = true;
        this.cdr.markForCheck();

        this.timers.push(setTimeout(() => {
          this.searchReturning = false;
          this.showHint        = true;
          this.cdr.markForCheck();

          this.timers.push(setTimeout(() => {
            this.dismissHint();
          }, 10000));
        }, 900));
      }, 3000));
    }, 1000));
  }

  dismissHint() {
    this.showHint = false;
    this.cdr.markForCheck();
  }

  openSearch(): void {
    // Capture hero search bar position BEFORE overlay renders
    if (this.heroSearchInnerRef) {
      this.heroSearchRect = this.heroSearchInnerRef.nativeElement.getBoundingClientRect();
    }
    this.showSearchOverlay = true;
    this.cdr.markForCheck();
  }

  closeSearch(): void {
    this.showSearchOverlay = false;
    this.heroSearchRect = null;
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.timers.forEach(t => clearTimeout(t));
  }
}