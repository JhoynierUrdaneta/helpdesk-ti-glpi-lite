import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastNotice {
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private noticeSubject = new BehaviorSubject<ToastNotice | null>(null);
  public notice$ = this.noticeSubject.asObservable();

  show(message: string, type: 'success' | 'error' = 'success'): void {
    this.noticeSubject.next({ message, type });
    setTimeout(() => {
      if (this.noticeSubject.value?.message === message) {
        this.noticeSubject.next(null);
      }
    }, 4000);
  }
}
