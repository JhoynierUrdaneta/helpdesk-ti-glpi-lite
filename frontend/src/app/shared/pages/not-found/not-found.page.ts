import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6">
      <div class="bento-card p-10 max-w-md w-full text-center space-y-4">
        <span class="badge-pill badge-neutral font-mono-code">404 // NOT FOUND</span>
        <h1 class="font-editorial text-4xl text-[#111111]">Ruta no encontrada</h1>
        <p class="text-xs text-[#787774]">
          La vista solicitada no existe dentro del Workspace TI.
        </p>
        <a routerLink="/app/panel" class="btn-primary-minimal inline-flex items-center gap-2 px-5 py-2.5 text-xs">
          <i class="ph-bold ph-arrow-left"></i> Volver al Panel Principal
        </a>
      </div>
    </div>
  `
})
export class NotFoundPageComponent {}
