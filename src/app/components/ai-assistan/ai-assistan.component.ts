import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  AiService,
  ChatMessage as ApiChatMessage,
  MedicineCard,
  AlternativeCard,
  PharmacyLocation,
  PharmaciesUnavailableReason,
  AiChatResponse,
} from '../../core/services/ai.service';
import { AuthStateService } from '../../core/services/auth-state';
import { AiChatBridgeService } from '../../core/services/ai-chat-bridge.service';

type ChatBubbleKind =
  | 'text'
  | 'medicine-card'
  | 'alternative-card'
  | 'auth-required'
  | 'error'
  | 'pharmacies'
  | 'pharmacies-unavailable';

interface ChatMessage {
  role: 'user' | 'ai';
  kind: ChatBubbleKind;
  text?: string;
  card?: MedicineCard | AlternativeCard;
  pharmacies?: PharmacyLocation[];
  unavailableReason?: PharmaciesUnavailableReason;
  time: string;
}

interface IntroMessage {
  text: string;
  time: string;
  visible: boolean;
}

type RevealItem =
  | { kind: 'text'; text: string }
  | { kind: 'medicine-card'; card: MedicineCard }
  | { kind: 'alternative-card'; card: AlternativeCard }
  | { kind: 'pharmacies'; pharmacies: PharmacyLocation[] }
  | { kind: 'pharmacies-unavailable'; reason: PharmaciesUnavailableReason };

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistan.component.html',
  styleUrl: './ai-assistan.component.css',
})
export class AiChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput')         chatInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chatWidget')        chatWidgetEl!: ElementRef<HTMLDivElement>;
  @ViewChild('trailCanvas')       trailCanvasRef!: ElementRef<HTMLCanvasElement>;

  isChatOpen      = false;
  isAnimating     = false;
  isClosing       = false;
  isTyping        = false;
  showSuggestions = false;
  isSpiralDone    = false;

  inputText    = '';
  messages: ChatMessage[] = [];
  quickReplies: string[]  = [];

  private openTimeout?:   ReturnType<typeof setTimeout>;
  private chunkTimeout?:  ReturnType<typeof setTimeout>;
  private spiralRaf?:     number;
  private chatSub?:       Subscription;
  private bridgeSub?:     Subscription;
  private canvas!: HTMLCanvasElement;
  private ctx!:    CanvasRenderingContext2D;

  introMessages: IntroMessage[] = [
    {
      text: '👋 أهلاً! أنا مساعد <strong>MediSearch</strong> الذكي.<br>بساعدك تلاقي أي دواء، تقارن الأسعار، أو تعرف البدائل المتاحة.',
      time: this.getTime(),
      visible: false,
    },
    {
      text: '💊 تقدر تسألني عن:<br>• <strong>أسعار الأدوية</strong> في الصيدليات القريبة<br>• <strong>بدائل رخيصة</strong> لنفس المادة الفعالة<br>• <strong>التفاعلات الدوائية</strong> وهل الدواء آمن',
      time: this.getTime(),
      visible: false,
    },
    {
      text: '🔍 ابدأ باسم الدواء أو المادة الفعالة وأنا هاخد منك من هناك!',
      time: this.getTime(),
      visible: false,
    },
  ];

  suggestions = [
    'ما هو بديل Panadol Extra؟',
    'سعر Augmentin في الصيدليات',
    'هل Aspirin و Brufen يؤخذان معاً؟',
    'أقرب صيدلية فيها Concor',
  ];

  private readonly defaultQuickReplies = [
    'دواء آخر',
    'ابحث بالمادة الفعالة',
    'صيدليات قريبة',
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private aiService: AiService,
    private authState: AuthStateService,
    private aiChatBridge: AiChatBridgeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Allows any other part of the app (e.g. the search overlay's "Ask AI" button)
    // to open this chat and ask a question on the user's behalf.
    this.bridgeSub = this.aiChatBridge.ask$.subscribe((query) => {
      this.openWithQuestion(query);
    });
  }

  ngAfterViewInit(): void {
    this.canvas = this.trailCanvasRef.nativeElement;
    this.ctx    = this.canvas.getContext('2d')!;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  ngOnDestroy(): void {
    clearTimeout(this.openTimeout);
    clearTimeout(this.chunkTimeout);
    this.chatSub?.unsubscribe();
    this.bridgeSub?.unsubscribe();
    if (this.spiralRaf) cancelAnimationFrame(this.spiralRaf);
    window.removeEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // ── Open / Close ─────────────────────────────────────────────────────────

  openChat(onOpened?: () => void): void {
    if (this.isChatOpen) {
      onOpened?.();
      return;
    }

    if (this.isAnimating) return;

    this.isAnimating = true;
    this.cdr.detectChanges();

    const fabEl = document.querySelector('.chat-fab') as HTMLElement | null;
    if (!fabEl) { this._finishOpen(undefined, undefined, onOpened); return; }

    const fabRect = fabEl.getBoundingClientRect();
    const fabCX   = fabRect.left + fabRect.width  / 2;
    const fabCY   = fabRect.top  + fabRect.height / 2;
    const screenCX = window.innerWidth  / 2;
    const screenCY = window.innerHeight / 2;

    this.playBurst(fabCX, fabCY, () => {
      this.playSpiral(fabCX, fabCY, screenCX, screenCY, () => {
        this.clearCanvas();
        this._finishOpen(screenCX, screenCY, onOpened);
      });
    });
  }

  private _finishOpen(cx?: number, cy?: number, onOpened?: () => void): void {
    this.positionWidget(cx, cy);
    this.isChatOpen  = true;
    this.isAnimating = false;
    this.cdr.detectChanges();

    this.introMessages.forEach((msg, i) => {
      setTimeout(() => {
        msg.visible = true;
        this.scrollToBottom();
        this.cdr.detectChanges();
        if (i === this.introMessages.length - 1) {
          setTimeout(() => { this.showSuggestions = true; this.cdr.detectChanges(); }, 400);
        }
      }, 400 + i * 650);
    });

    setTimeout(() => this.chatInput?.nativeElement.focus(), 700);

    onOpened?.();
  }

  closeChat(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.isChatOpen = false;
      this.isClosing  = false;
      this.clearCanvas();
      this.cdr.detectChanges();
    }, 420);
  }

  /** Opens the chat (if needed) then asks the given question automatically */
  private openWithQuestion(query: string): void {
    if (!query?.trim()) return;

    if (this.isAnimating) {
      // Another open animation is already mid-flight — retry shortly.
      setTimeout(() => this.openWithQuestion(query), 120);
      return;
    }

    this.openChat(() => {
      setTimeout(() => this.askQueuedQuestion(query), 350);
    });
  }

  private askQueuedQuestion(query: string): void {
    this.inputText = query;
    this.sendMessage();
  }

  // ── Canvas Animations ────────────────────────────────────────────────────

  private playBurst(cx: number, cy: number, onDone: () => void): void {
    const rings   = [
      { r: 0, maxR: 60,  alpha: 1,   color: '#0EA5E9', delay: 0 },
      { r: 0, maxR: 90,  alpha: 0.7, color: '#8B5CF6', delay: 60 },
      { r: 0, maxR: 120, alpha: 0.4, color: '#0EA5E9', delay: 120 },
    ];
    const start   = performance.now();
    const dur     = 380;

    const tick = (now: number) => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let allDone = true;

      rings.forEach(ring => {
        const t = Math.max(0, (now - start - ring.delay) / dur);
        if (t < 1) allDone = false;
        const ease = 1 - Math.pow(1 - Math.min(t, 1), 3);
        const r     = ring.maxR * ease;
        const alpha = ring.alpha * (1 - ease);

        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.strokeStyle = ring.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.lineWidth   = 2.5;
        this.ctx.stroke();
      });

      this.ctx.globalAlpha = 1;

      if (!allDone) {
        this.spiralRaf = requestAnimationFrame(tick);
      } else {
        this.clearCanvas();
        onDone();
      }
    };

    this.spiralRaf = requestAnimationFrame(tick);
  }

  private playSpiral(
    x1: number, y1: number,
    x2: number, y2: number,
    onDone: () => void,
  ): void {
    const dur       = 700;
    const start     = performance.now();
    const turns     = 2.5;
    const maxRadius = 80;

    const totalPoints = 200;
    const spiralPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= totalPoints; i++) {
      const pct   = i / totalPoints;
      const angle = pct * Math.PI * 2 * turns - Math.PI / 2;
      const rad   = maxRadius * Math.sin(pct * Math.PI);
      const lx    = x1 + (x2 - x1) * pct + Math.cos(angle) * rad;
      const ly    = y1 + (y2 - y1) * pct + Math.sin(angle) * rad;
      spiralPts.push({ x: lx, y: ly });
    }

    const tick = (now: number) => {
      this.clearCanvas();
      const rawT  = (now - start) / dur;
      const t     = Math.min(rawT, 1);
      const ease  = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const head  = Math.floor(ease * totalPoints);
      const tail  = Math.max(0, head - 40);

      for (let i = tail; i < head; i++) {
        const segT  = (i - tail) / (head - tail);
        const p     = spiralPts[i];
        const np    = spiralPts[i + 1] || p;
        const alpha = segT * 0.9;
        const width = 1 + segT * 3;

        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(np.x, np.y);

        const grad = this.ctx.createLinearGradient(p.x, p.y, np.x, np.y);
        grad.addColorStop(0, `rgba(14,165,233,${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(139,92,246,${alpha})`);

        this.ctx.strokeStyle  = grad;
        this.ctx.lineWidth    = width;
        this.ctx.globalAlpha  = 1;
        this.ctx.lineCap      = 'round';
        this.ctx.stroke();
      }

      if (head < spiralPts.length) {
        const hp = spiralPts[head];
        const glow = this.ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 14);
        glow.addColorStop(0,   'rgba(255,255,255,0.95)');
        glow.addColorStop(0.3, 'rgba(14,165,233,0.8)');
        glow.addColorStop(0.7, 'rgba(139,92,246,0.4)');
        glow.addColorStop(1,   'rgba(139,92,246,0)');

        this.ctx.beginPath();
        this.ctx.arc(hp.x, hp.y, 14, 0, Math.PI * 2);
        this.ctx.fillStyle  = glow;
        this.ctx.globalAlpha = 1;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(hp.x, hp.y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle  = '#ffffff';
        this.ctx.globalAlpha = 1;
        this.ctx.fill();
      }

      this.ctx.globalAlpha = 1;

      if (t < 1) {
        this.spiralRaf = requestAnimationFrame(tick);
      } else {
        this.playDestinationBurst(x2, y2, onDone);
      }
    };

    this.spiralRaf = requestAnimationFrame(tick);
  }

  private playDestinationBurst(cx: number, cy: number, onDone: () => void): void {
    const dur   = 280;
    const start = performance.now();
    const rays   = 8;

    const tick = (now: number) => {
      this.clearCanvas();
      const t    = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 2);

      const glow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * ease);
      glow.addColorStop(0,   `rgba(14,165,233,${0.6 * (1 - t)})`);
      glow.addColorStop(0.5, `rgba(139,92,246,${0.3 * (1 - t)})`);
      glow.addColorStop(1,   'rgba(139,92,246,0)');
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 60 * ease, 0, Math.PI * 2);
      this.ctx.fillStyle = glow;
      this.ctx.fill();

      for (let r = 0; r < rays; r++) {
        const angle = (r / rays) * Math.PI * 2;
        const len   = 40 * ease;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        this.ctx.strokeStyle = r % 2 === 0 ? '#0EA5E9' : '#8B5CF6';
        this.ctx.globalAlpha = (1 - ease) * 0.8;
        this.ctx.lineWidth   = 2;
        this.ctx.stroke();
      }

      this.ctx.globalAlpha = 1;

      if (t < 1) {
        this.spiralRaf = requestAnimationFrame(tick);
      } else {
        this.clearCanvas();
        onDone();
      }
    };

    this.spiralRaf = requestAnimationFrame(tick);
  }

  private clearCanvas(): void {
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ── Widget Positioning ────────────────────────────────────────────────────

  private positionWidget(screenCX?: number, screenCY?: number): void {
    const widgetEl = this.chatWidgetEl?.nativeElement;
    if (!widgetEl) return;

    const vw  = window.innerWidth;
    const vh  = window.innerHeight;
    const cx  = screenCX ?? vw / 2;
    const cy  = screenCY ?? vh / 2;
    const ww  = Math.min(400, vw - 24);
    const wh  = 620;

    widgetEl.style.left = `${cx - ww / 2}px`;
    widgetEl.style.top  = `${Math.max(12, cy - wh / 2)}px`;

    widgetEl.style.setProperty('--dx', '0px');
    widgetEl.style.setProperty('--dy', '0px');
  }

  // ── Messaging ─────────────────────────────────────────────────────────────

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isTyping) return;

    this.addUserMessage(text);
    this.inputText       = '';
    this.quickReplies    = [];
    this.showSuggestions = false;

    if (!this.authState.isLoggedIn()) {
      this.showAuthRequired();
      return;
    }

    this.sendToAI(text);
  }

  sendSuggestion(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }

  private addUserMessage(text: string): void {
    this.messages.push({ role: 'user', kind: 'text', text, time: this.getTime() });
    this.scrollToBottom();
  }

  private showAuthRequired(): void {
    this.messages.push({ role: 'ai', kind: 'auth-required', time: this.getTime() });
    this.scrollToBottom();
    this.cdr.detectChanges();
  }

  private sendToAI(userText: string): void {
    this.isTyping = true;
    this.cdr.detectChanges();
    this.scrollToBottom();

    const history: ApiChatMessage[] = this.messages
      .filter((m) => m.kind === 'text' && m.text)
      .slice(0, -1)
      .map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        text: m.text!,
      }));

    this.chatSub?.unsubscribe();
    this.chatSub = this.aiService.chat(userText, history).subscribe({
      next: (res: AiChatResponse) => {
        const queue = this.buildRevealQueue(res);
        this.revealQueue(queue);
      },
      error: (err) => {
        this.isTyping = false;

        if (err?.status === 401 || err?.status === 403) {
          this.showAuthRequired();
          return;
        }

        this.messages.push({
          role: 'ai',
          kind: 'error',
          text: 'حصلت مشكلة في الاتصال بالمساعد. حاول تاني بعد شوية.',
          time: this.getTime(),
        });
        this.scrollToBottom();
        this.cdr.detectChanges();
      },
    });
  }

  private buildRevealQueue(res: AiChatResponse): RevealItem[] {
    const queue: RevealItem[] = (res.messages ?? [])
      .filter((t) => !!t?.trim())
      .map((text) => ({ kind: 'text', text }));

    if (res.medicineCard) {
      queue.push({ kind: 'medicine-card', card: res.medicineCard });
    }

    if (res.alternativeCard) {
      queue.push({ kind: 'alternative-card', card: res.alternativeCard });
    }

    if (res.nearbyPharmacies?.length) {
      queue.push({ kind: 'pharmacies', pharmacies: res.nearbyPharmacies });
    } else if (res.pharmaciesUnavailableReason) {
      queue.push({ kind: 'pharmacies-unavailable', reason: res.pharmaciesUnavailableReason });
    }

    return queue;
  }

  private revealQueue(queue: RevealItem[], index = 0): void {
    if (index >= queue.length) {
      this.isTyping = false;
      this.quickReplies = this.defaultQuickReplies;
      this.scrollToBottom();
      this.cdr.detectChanges();
      return;
    }

    this.isTyping = true;
    this.cdr.detectChanges();
    this.scrollToBottom();

    const item = queue[index];
    const readDelay = item.kind === 'text' ? Math.min(1600, 450 + item.text.length * 10) : 550;

    this.chunkTimeout = setTimeout(() => {
      this.isTyping = false;

      if (item.kind === 'text') {
        this.messages.push({ role: 'ai', kind: 'text', text: item.text, time: this.getTime() });
      } else if (item.kind === 'pharmacies') {
        this.messages.push({ role: 'ai', kind: 'pharmacies', pharmacies: item.pharmacies, time: this.getTime() });
      } else if (item.kind === 'pharmacies-unavailable') {
        this.messages.push({ role: 'ai', kind: 'pharmacies-unavailable', unavailableReason: item.reason, time: this.getTime() });
      } else {
        this.messages.push({ role: 'ai', kind: item.kind, card: item.card, time: this.getTime() });
      }

      this.scrollToBottom();
      this.cdr.detectChanges();

      this.chunkTimeout = setTimeout(() => {
        this.revealQueue(queue, index + 1);
      }, 350);
    }, readDelay);
  }

  searchForMedicine(query: string): void {
    this.closeChat();
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  openPharmacyOnMaps(pharmacy: PharmacyLocation): void {
    window.open(pharmacy.mapsUrl, '_blank', 'noopener');
  }

  goToRegister(): void {
    this.closeChat();
    this.router.navigate(['/register']);
  }

  goToLogin(): void {
    this.closeChat();
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    this.closeChat();
    this.router.navigate(['/settings']);
  }

  cardReason(msg: ChatMessage): string | null {
    return (msg.card as AlternativeCard)?.reason ?? null;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 80);
  }

  private getTime(): string {
    return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }
}