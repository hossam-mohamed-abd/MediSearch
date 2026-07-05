import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Lightweight bridge so components that don't share a parent (search overlay,
 * navbar, etc.) can ask the global AI chat widget to open with a pre-filled question.
 */
@Injectable({
  providedIn: 'root',
})
export class AiChatBridgeService {
  private askSubject = new Subject<string>();

  /** Emits whenever some part of the app wants the AI chat opened with a question */
  ask$ = this.askSubject.asObservable();

  askAbout(query: string): void {
    this.askSubject.next(query);
  }
}
