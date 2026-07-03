import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavoriteFlyService {
  /**
   * Plays a "burst then fly to navbar heart icon" animation,
   * starting from the given source element (the clicked favorite button).
   */
  fly(sourceEl: HTMLElement): void {
    const targetEl = document.querySelector<HTMLElement>('[data-fav-nav-icon]');
    if (!targetEl) return;

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;

    const baseFontSize = 24; // px
    const peakSizePx = Math.min(window.innerWidth, window.innerHeight) * 0.5;
    const peakScale = peakSizePx / baseFontSize;
    const endScale = 16 / baseFontSize;

    // Soft glow flash behind the heart for extra "fills the screen" feel
    const glow = document.createElement('div');
    glow.style.position = 'fixed';
    glow.style.left = `${sourceCenterX}px`;
    glow.style.top = `${sourceCenterY}px`;
    glow.style.width = '10px';
    glow.style.height = '10px';
    glow.style.borderRadius = '50%';
    glow.style.background =
      'radial-gradient(circle, rgba(244,63,94,0.35) 0%, rgba(244,63,94,0) 70%)';
    glow.style.pointerEvents = 'none';
    glow.style.zIndex = '9998';
    glow.style.transform = 'translate(-50%, -50%) scale(0)';
    document.body.appendChild(glow);

    // The flying heart itself
    const heart = document.createElement('i');
    heart.className = 'fa-solid fa-heart';
    heart.style.position = 'fixed';
    heart.style.left = `${sourceCenterX}px`;
    heart.style.top = `${sourceCenterY}px`;
    heart.style.fontSize = `${baseFontSize}px`;
    heart.style.color = '#f43f5e';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '9999';
    heart.style.willChange = 'transform, opacity';
    heart.style.filter = 'drop-shadow(0 6px 18px rgba(244,63,94,0.45))';
    heart.style.transform = 'translate(-50%, -50%) scale(0)';
    document.body.appendChild(heart);

    glow.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.6 },
        { transform: 'translate(-50%, -50%) scale(45)', opacity: 0.35, offset: 0.32 },
        { transform: 'translate(-50%, -50%) scale(50)', opacity: 0, offset: 0.55 },
      ],
      { duration: 700, easing: 'ease-out', fill: 'forwards' },
    );

    const flyAnim = heart.animate(
      [
        {
          offset: 0,
          transform: 'translate(-50%, -50%) translate(0px, 0px) scale(0) rotate(0deg)',
          opacity: 0,
        },
        {
          offset: 0.1,
          transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1.3) rotate(-6deg)',
          opacity: 1,
          easing: 'cubic-bezier(.34,1.56,.64,1)',
        },
        {
          offset: 0.32,
          transform: `translate(-50%, -50%) translate(0px, 0px) scale(${peakScale}) rotate(4deg)`,
          opacity: 1,
          easing: 'cubic-bezier(.22,.9,.32,1)',
        },
        {
          offset: 0.5,
          transform: `translate(-50%, -50%) translate(0px, 0px) scale(${peakScale * 0.94}) rotate(-2deg)`,
          opacity: 1,
        },
        {
          offset: 0.8,
          transform: `translate(-50%, -50%) translate(${dx * 0.75}px, ${dy * 0.75 - 40}px) scale(${
            (peakScale + endScale) / 2
          }) rotate(-10deg)`,
          opacity: 1,
          easing: 'cubic-bezier(.4,0,.2,1)',
        },
        {
          offset: 1,
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${endScale}) rotate(-14deg)`,
          opacity: 0.9,
        },
      ],
      { duration: 1150, easing: 'ease-in-out', fill: 'forwards' },
    );

    flyAnim.onfinish = () => {
      heart.remove();
      glow.remove();
      this.pulseTarget(targetEl);
    };
  }

  private pulseTarget(el: HTMLElement): void {
    el.classList.add('fav-target-pulse');
    setTimeout(() => el.classList.remove('fav-target-pulse'), 550);
  }
}
