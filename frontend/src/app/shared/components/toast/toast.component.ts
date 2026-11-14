import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="toast.notice$ | async as notice" class="fixed bottom-6 right-6 z-50 max-w-md fade-entry">
      <div
        class="px-4 py-3 rounded-lg border text-xs font-semibold flex items-center gap-3"
        [ngClass]="
          notice.type === 'error'
            ? 'bg-[#FDEBEC] text-[#9F2F2D] border-[#f5c2c4]'
            : 'bg-[#111111] text-white border-[#111111]'
        "
      >
        <i
          class="ph-bold text-base"
          [ngClass]="notice.type === 'error' ? 'ph-warning-circle' : 'ph-check-circle'"
        ></i>
        <span>{{ notice.message }}</span>
      </div>
    </div>
  `
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
