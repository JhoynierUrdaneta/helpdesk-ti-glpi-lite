import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <!-- Columna izquierda: Formulario -->
      <div class="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg bg-[#2B95D6] flex items-center justify-center shadow-sm">
              <i class="ph-bold ph-lifebuoy text-xl text-white"></i>
            </div>
            <div class="leading-none">
              <span class="font-bold text-base tracking-tight text-[#1E293B] block">TEAM<span class="text-[#2B95D6]">TI</span></span>
              <span class="text-[11px] text-[#64748B] font-medium">Mesa de Servicio · v2.0</span>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-[11px] font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span> En línea
          </span>
        </div>

        <div class="w-full max-w-md mx-auto my-10 fade-entry">
          <router-outlet />
        </div>

        <div class="flex items-center justify-between text-xs text-[#94A3B8] border-t border-[#F1F5F9] pt-5">
          <span>Departamento de Tecnologías de la Información</span>
          <span class="font-mono-code">GLPI-Lite · FastAPI + Angular</span>
        </div>
      </div>

      <!-- Columna derecha: Ilustración y vista previa del sistema -->
      <div class="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#243648] via-[#1F3041] to-[#162330] text-white p-12 xl:p-16 flex-col justify-between">
        <!-- Patrón de grilla sutil -->
        <div class="absolute inset-0 opacity-[0.06]"
             style="background-image: radial-gradient(#FFFFFF 1px, transparent 1px); background-size: 24px 24px;">
        </div>
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#2B95D6]/20 blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#38A169]/15 blur-3xl"></div>

        <div class="relative z-10">
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-[#BAE6FD]">
            <i class="ph-bold ph-shield-check"></i> Plataforma Interna TI
          </span>
          <h2 class="text-3xl xl:text-4xl font-bold tracking-tight mt-5 leading-tight">
            Centraliza tus incidentes y genera tu informe mensual en segundos.
          </h2>
          <p class="text-sm text-[#CBD5E1] mt-3 max-w-lg leading-relaxed">
            Control de tickets por sede y categoría con bitácora auditable, cálculo automático de SLA y exportación directa a Word y PDF con evidencias.
          </p>
        </div>

        <!-- Ilustración vectorial + tarjetas flotantes -->
        <div class="relative z-10 my-8 flex items-center justify-center">
          <div class="w-full max-w-lg space-y-4">
            <!-- Tarjeta principal ilustrada -->
            <div class="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-5 shadow-2xl">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#F87171]"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-[#FBBF24]"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-[#4ADE80]"></span>
                </div>
                <span class="text-[11px] font-mono-code text-[#94A3B8]">ticket #1042 · SLA 1.8h</span>
              </div>

              <div class="flex items-center gap-5">
                <!-- Ilustración SVG técnica -->
                <svg viewBox="0 0 140 120" class="w-32 h-28 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="14" width="124" height="86" rx="10" fill="#1E293B" stroke="#38BDF8" stroke-opacity="0.4" stroke-width="1.5"/>
                  <rect x="18" y="26" width="54" height="8" rx="4" fill="#38BDF8" fill-opacity="0.85"/>
                  <rect x="18" y="42" width="84" height="6" rx="3" fill="#94A3B8" fill-opacity="0.5"/>
                  <rect x="18" y="54" width="68" height="6" rx="3" fill="#94A3B8" fill-opacity="0.35"/>
                  <rect x="18" y="72" width="40" height="16" rx="5" fill="#38A169"/>
                  <path d="M28 80L33 85L43 75" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="106" cy="76" r="16" fill="#2B95D6" fill-opacity="0.25" stroke="#38BDF8" stroke-width="1.5"/>
                  <path d="M100 76L104 80L113 71" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>

                <div class="space-y-2.5 flex-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-white">Configuración VPN Sede Norte</span>
                    <span class="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold">Cerrado</span>
                  </div>
                  <p class="text-xs text-[#CBD5E1] leading-relaxed">
                    Bitácora actualizada, evidencia adjunta y tiempo de atención registrado automáticamente.
                  </p>
                  <div class="flex items-center gap-3 pt-1 text-[11px] text-[#94A3B8]">
                    <span class="inline-flex items-center gap-1"><i class="ph ph-buildings text-[#38BDF8]"></i> Sede Principal</span>
                    <span class="inline-flex items-center gap-1"><i class="ph ph-clock text-[#4ADE80]"></i> En tiempo</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dos mini tarjetas inferiores -->
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-[#2B95D6]/30 flex items-center justify-center text-[#38BDF8]">
                    <i class="ph-bold ph-file-doc text-lg"></i>
                  </div>
                  <div>
                    <p class="text-xs font-semibold">Exportación Word & PDF</p>
                    <p class="text-[11px] text-[#94A3B8]">Con fotos incrustadas</p>
                  </div>
                </div>
              </div>

              <div class="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-[#38A169]/30 flex items-center justify-center text-[#4ADE80]">
                    <i class="ph-bold ph-chart-line-up text-lg"></i>
                  </div>
                  <div>
                    <p class="text-xs font-semibold">Métricas & SLA</p>
                    <p class="text-[11px] text-[#94A3B8]">Seguimiento en vivo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pie informativo -->
        <div class="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-5 text-xs text-[#CBD5E1]">
          <div class="flex items-center gap-2">
            <i class="ph-bold ph-check-circle text-[#4ADE80]"></i>
            <span>Bitácora auditable</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="ph-bold ph-check-circle text-[#4ADE80]"></i>
            <span>Semana 1 a 4 auto</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="ph-bold ph-check-circle text-[#4ADE80]"></i>
            <span>Acceso por roles</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthLayoutComponent {}
