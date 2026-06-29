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

  ngOnDestroy() {
    this.timers.forEach(t => clearTimeout(t));
  }
}   