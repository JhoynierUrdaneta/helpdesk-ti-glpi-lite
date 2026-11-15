import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-[#243648] flex flex-col justify-center items-center px-4 py-12">
      <div class="w-full max-w-md bg-white rounded-lg border border-[#CBD5E1] shadow-lg overflow-hidden fade-entry">
        <div class="px-6 py-4 bg-[#2C3E50] text-white flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded bg-[#2B95D6] flex items-center justify-center">
              <i class="ph-bold ph-lifebuoy text-lg"></i>
            </div>
            <div>
              <span class="font-bold text-sm tracking-tight block leading-none">HelpDesk TI</span>
              <span class="text-[11px] text-[#94A3B8]">Mesa de Servicio · v2.0</span>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 text-[11px] text-[#86EFAC] font-medium">
            <span class="w-2 h-2 rounded-full bg-[#38A169]"></span> En línea
          </span>
        </div>
        <div class="p-8">
          <router-outlet />
        </div>
      </div>
    </div>
  `
})
export class AuthLayoutComponent {}
