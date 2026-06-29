import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent implements OnInit, OnDestroy {
  searchAnimating = false;
  searchReturning = false;
  showHint        = false;

  private timers: any[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Step 1: بعد 2 ثانية — حرّك الـ search لوسط الشاشة
    this.timers.push(setTimeout(() => {
      this.searchAnimating = true;
      this.cdr.markForCheck();

      // Step 2: بعد 3 ثواني — رجّعه مكانه
      this.timers.push(setTimeout(() => {
        this.searchAnimating = false;
        this.searchReturning = true;
        this.cdr.markForCheck();

        // Step 3: بعد 0.9s (وقت transition الرجوع) — اظهر النوتة
        this.timers.push(setTimeout(() => {
          this.searchReturning = false;
          this.showHint        = true;
          this.cdr.markForCheck();

          // Step 4: بعد 10 ثواني — اخفيها
          this.timers.push(setTimeout(() => {
            this.dismissHint();
          }, 10000));
        }, 900));
      }, 3000));
    }, 2000));
  }

  dismissHint() {
    this.showHint = false;
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.timers.forEach(t => clearTimeout(t));
  }
}   