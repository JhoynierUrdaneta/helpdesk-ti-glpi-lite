import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-[#F7F6F3] flex flex-col justify-center items-center px-4 py-16">
      <div class="w-full max-w-md bento-card overflow-hidden fade-entry">
        <div class="px-5 py-3 bg-[#F9F9F8] border-b border-[#EAEAEA] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#EAEAEA] inline-block"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#EAEAEA] inline-block"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#EAEAEA] inline-block"></span>
          </div>
          <span class="font-mono-code text-[11px] text-[#787774]">TI-WORKSPACE // GLPI-LITE v2.0</span>
        </div>
        <div class="p-8 sm:p-10">
          <router-outlet />
        </div>
      </div>
    </div>
  `
})
export class AuthLayoutComponent {}
