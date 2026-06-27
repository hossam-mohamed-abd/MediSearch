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

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  time: string;
}

interface IntroMessage {
  text: string;
  time: string;
  visible: boolean;
}

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
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private spiralRaf?:     number;
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

  private quickReplyMap: Record<string, string[]> = {
    default: ['دواء آخر', 'ابحث بالمادة الفعالة', 'صيدليات قريبة'],
    price:   ['مقارنة أسعار', 'أرخص بديل', 'صيدليات متاحة'],
    alt:     ['عرض التفاصيل', 'مقارنة الأسعار', 'تفاعلات دوائية'],
    safety:  ['اسأل عن دواء آخر', 'تعرف على الجرعة', 'ابحث في الصيدليات'],
  };

  private aiResponses: Record<string, { text: string; topic: string }> = {
    panadol: {
      topic: 'alt',
      text: '💊 <strong>Panadol Extra</strong> — المادة الفعالة: Paracetamol + Caffeine<br><br>✅ <strong>بدائل متاحة:</strong><br>• <strong>Fevadol Plus</strong> — 35 جنيه<br>• <strong>Paramol Extra</strong> — 38 جنيه<br>• <strong>Cataflam D</strong> — فعّال بديلاً<br><br>📍 أقرب صيدلية على بُعد <strong>1.2 كم</strong>',
    },
    augmentin: {
      topic: 'price',
      text: '🔵 <strong>Augmentin 1g</strong> — Amoxicillin + Clavulanate<br><br>💰 <strong>مقارنة الأسعار:</strong><br>• El Ezaby — <strong>118 جنيه</strong> ✅<br>• Seif Pharmacy — 125 جنيه<br>• Ghaba — 130 جنيه<br><br>⚠️ تحتاج روشتة طبيب.',
    },
    brufen: {
      topic: 'alt',
      text: '🟠 <strong>Brufen 400mg</strong> — Ibuprofen<br><br>✅ <strong>بدائل:</strong><br>• <strong>Ibugesic</strong> — 40 جنيه<br>• <strong>Motrin</strong> — 48 جنيه<br>• <strong>Nurofen</strong> — 55 جنيه<br><br>⚠️ لا تؤخذ على معدة فارغة.',
    },
    aspirin: {
      topic: 'safety',
      text: '⚠️ <strong>تحذير — تفاعل دوائي</strong><br><br>Aspirin + Brufen قد يُقلل فعالية حماية القلب ويزيد خطر نزيف المعدة.<br><br>✅ <strong>البديل الآمن:</strong> Paracetamol بدلاً من Brufen مع Aspirin.<br><br>🔴 استشر طبيبك.',
    },
    concor: {
      topic: 'price',
      text: '❤️ <strong>Concor 5mg</strong> — Bisoprolol<br><br>📍 <strong>صيدليات قريبة:</strong><br>• El Ezaby — الدقي 🟢 متوفر — 1.1 كم<br>• Seif Pharmacy — المهندسين 🟢 — 1.8 كم<br>• Rushdy — الجيزة 🔴 غير متوفر<br><br>💰 السعر: <strong>85 جنيه</strong>',
    },
    default: {
      topic: 'default',
      text: '🔍 لم أجد معلومات محددة حالياً.<br><br>💡 جرب:<br>• كتابة المادة الفعالة (مثل Paracetamol)<br>• التحقق من الاسم التجاري<br>• استخدام البحث الرئيسي في الموقع',
    },
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.canvas = this.trailCanvasRef.nativeElement;
    this.ctx    = this.canvas.getContext('2d')!;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  ngOnDestroy(): void {
    clearTimeout(this.openTimeout);
    clearTimeout(this.typingTimeout);
    if (this.spiralRaf) cancelAnimationFrame(this.spiralRaf);
    window.removeEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // ── Open / Close ─────────────────────────────────────────────────────────

  openChat(): void {
    if (this.isAnimating || this.isChatOpen) return;
    this.isAnimating = true;
    this.cdr.detectChanges();

    const fabEl = document.querySelector('.chat-fab') as HTMLElement | null;
    if (!fabEl) { this._finishOpen(); return; }

    const fabRect = fabEl.getBoundingClientRect();
    const fabCX   = fabRect.left + fabRect.width  / 2;
    const fabCY   = fabRect.top  + fabRect.height / 2;
    const screenCX = window.innerWidth  / 2;
    const screenCY = window.innerHeight / 2;

    // Phase 1: burst rings from FAB
    this.playBurst(fabCX, fabCY, () => {
      // Phase 2: draw spiral from FAB center → screen center
      this.playSpiral(fabCX, fabCY, screenCX, screenCY, () => {
        // Phase 3: clear canvas, open widget
        this.clearCanvas();
        this._finishOpen(screenCX, screenCY);
      });
    });
  }

  private _finishOpen(cx?: number, cy?: number): void {
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

  // ── Canvas Animations ────────────────────────────────────────────────────

  /** Phase 1: concentric burst rings expanding from FAB */
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

  /** Phase 2: spiral comet trail from (x1,y1) to (x2,y2) */
  private playSpiral(
    x1: number, y1: number,
    x2: number, y2: number,
    onDone: () => void,
  ): void {
    const dur       = 700;
    const start     = performance.now();
    const turns     = 2.5;
    const maxRadius = 80;

    // We'll draw the full spiral path and animate a "progress" along it
    const totalPoints = 200;
    const spiralPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= totalPoints; i++) {
      const pct   = i / totalPoints;
      const angle = pct * Math.PI * 2 * turns - Math.PI / 2;
      const rad   = maxRadius * Math.sin(pct * Math.PI); // bulge in middle
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

      // Draw tail gradient
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

      // Draw comet head glow
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

        // Inner bright dot
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
        // Flash burst at destination
        this.playDestinationBurst(x2, y2, onDone);
      }
    };

    this.spiralRaf = requestAnimationFrame(tick);
  }

  /** Phase 2b: small starburst at screen center before widget appears */
  private playDestinationBurst(cx: number, cy: number, onDone: () => void): void {
    const dur   = 280;
    const start = performance.now();
    const rays   = 8;

    const tick = (now: number) => {
      this.clearCanvas();
      const t    = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 2);

      // outer glow ring
      const glow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * ease);
      glow.addColorStop(0,   `rgba(14,165,233,${0.6 * (1 - t)})`);
      glow.addColorStop(0.5, `rgba(139,92,246,${0.3 * (1 - t)})`);
      glow.addColorStop(1,   'rgba(139,92,246,0)');
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 60 * ease, 0, Math.PI * 2);
      this.ctx.fillStyle = glow;
      this.ctx.fill();

      // rays
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

    // CSS vars for the bloom transform-origin hint (not used for offset anymore)
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
    this.simulateTyping(text);
  }

  sendSuggestion(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }

  private addUserMessage(text: string): void {
    this.messages.push({ role: 'user', text, time: this.getTime() });
    this.scrollToBottom();
  }

  private simulateTyping(userText: string): void {
    this.isTyping = true;
    this.scrollToBottom();
    const delay = 1000 + Math.random() * 800;

    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      const response = this.getAiResponse(userText);
      this.messages.push({ role: 'ai', text: response.text, time: this.getTime() });
      this.quickReplies = this.quickReplyMap[response.topic] ?? this.quickReplyMap['default'];
      this.scrollToBottom();
      this.cdr.detectChanges();
    }, delay);
  }

  private getAiResponse(userText: string): { text: string; topic: string } {
    const lower = userText.toLowerCase();
    if (lower.includes('panadol'))                               return this.aiResponses['panadol'];
    if (lower.includes('augmentin'))                             return this.aiResponses['augmentin'];
    if (lower.includes('brufen') || lower.includes('ibuprofen')) return this.aiResponses['brufen'];
    if (lower.includes('aspirin'))                               return this.aiResponses['aspirin'];
    if (lower.includes('concor'))                                return this.aiResponses['concor'];
    return this.aiResponses['default'];
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