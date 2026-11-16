import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogsService } from '../../shared/services/catalogs.service';
import { ToastService } from '../../shared/services/toast.service';
import { CatalogsBundle } from '../../shared/models/catalog.model';

type CatalogType = 'sedes' | 'categorias' | 'subcategorias';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 fade-entry">
      <div class="border-b border-[#E2E8F0] pb-5">
        <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Clasificación</span>
        <h2 class="text-2xl font-bold text-[#1E293B] mt-0.5">Sedes y Categorías</h2>
      </div>

      <div *ngIf="errorMsg" class="p-3.5 rounded-lg bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] text-xs font-semibold flex items-center justify-between gap-2">
        <span class="flex items-center gap-2"><i class="ph-bold ph-warning-circle text-base"></i> {{ errorMsg }}</span>
        <button (click)="errorMsg = ''" class="text-[#B91C1C] hover:underline">Cerrar</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" *ngIf="catalogs">
        <!-- Sedes -->
        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono-code uppercase tracking-wider text-[#64748B]">Sedes</h3>
          <form (ngSubmit)="add('sedes')" class="flex gap-2">
            <input [(ngModel)]="nombres.sedes" name="sede" placeholder="Nueva sede…" class="input-minimal" />
            <button type="submit" class="btn-primary-minimal px-3"><i class="ph ph-plus"></i></button>
          </form>
          <ul class="divide-y divide-[#E2E8F0] text-sm">
            <li *ngFor="let s of catalogs.sedes" class="py-2.5 flex items-center justify-between gap-2">
              <span class="truncate">{{ s.nombre }}</span>
              <ng-container *ngIf="confirmKey !== 'sedes-' + s.id; else confirmTpl">
                <button type="button" (click)="askRemove('sedes', s.id)" title="Eliminar" class="p-1.5 text-[#64748B] hover:text-[#B91C1C] rounded hover:bg-[#FEE2E2]/50">
                  <i class="ph ph-trash text-base"></i>
                </button>
              </ng-container>
              <ng-template #confirmTpl>
                <div class="flex items-center gap-1 shrink-0">
                  <button type="button" (click)="confirmRemove('sedes', s.id)" class="px-2 py-1 rounded bg-[#B91C1C] text-white text-[11px] font-semibold">Sí</button>
                  <button type="button" (click)="confirmKey = ''" class="px-2 py-1 rounded bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold">No</button>
                </div>
              </ng-template>
            </li>
          </ul>
        </div>

        <!-- Categorías -->
        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono-code uppercase tracking-wider text-[#64748B]">Categorías</h3>
          <form (ngSubmit)="add('categorias')" class="flex gap-2">
            <input [(ngModel)]="nombres.categorias" name="categoria" placeholder="Nueva categoría…" class="input-minimal" />
            <button type="submit" class="btn-primary-minimal px-3"><i class="ph ph-plus"></i></button>
          </form>
          <ul class="divide-y divide-[#E2E8F0] text-sm">
            <li *ngFor="let c of catalogs.categorias" class="py-2.5 flex items-center justify-between gap-2">
              <span class="truncate">{{ c.nombre }} <span class="font-mono-code text-[11px] text-[#64748B]">({{ c.subcategorias.length }})</span></span>
              <ng-container *ngIf="confirmKey !== 'categorias-' + c.id; else confirmCatTpl">
                <button type="button" (click)="askRemove('categorias', c.id)" title="Eliminar" class="p-1.5 text-[#64748B] hover:text-[#B91C1C] rounded hover:bg-[#FEE2E2]/50">
                  <i class="ph ph-trash text-base"></i>
                </button>
              </ng-container>
              <ng-template #confirmCatTpl>
                <div class="flex items-center gap-1 shrink-0">
                  <button type="button" (click)="confirmRemove('categorias', c.id)" class="px-2 py-1 rounded bg-[#B91C1C] text-white text-[11px] font-semibold">Sí</button>
                  <button type="button" (click)="confirmKey = ''" class="px-2 py-1 rounded bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold">No</button>
                </div>
              </ng-template>
            </li>
          </ul>
        </div>

        <!-- Subcategorías -->
        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono-code uppercase tracking-wider text-[#64748B]">Subcategorías</h3>
          <form (ngSubmit)="add('subcategorias')" class="space-y-2">
            <select [(ngModel)]="categoriaId" name="categoriaId" class="input-minimal">
              <option *ngFor="let c of catalogs.categorias" [ngValue]="c.id">{{ c.nombre }}</option>
            </select>
            <div class="flex gap-2">
              <input [(ngModel)]="nombres.subcategorias" name="subcategoria" placeholder="Nueva subcategoría…" class="input-minimal" />
              <button type="submit" class="btn-primary-minimal px-3"><i class="ph ph-plus"></i></button>
            </div>
          </form>
          <ul class="divide-y divide-[#E2E8F0] text-sm max-h-80 overflow-y-auto pr-1">
            <li *ngFor="let sub of catalogs.subcategorias" class="py-2.5 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate">{{ sub.nombre }}</p>
                <span class="text-[11px] font-mono-code text-[#64748B]">{{ categoriaNombre(sub.categoria_id) }}</span>
              </div>
              <ng-container *ngIf="confirmKey !== 'subcategorias-' + sub.id; else confirmSubTpl">
                <button type="button" (click)="askRemove('subcategorias', sub.id)" title="Eliminar" class="p-1.5 text-[#64748B] hover:text-[#B91C1C] rounded hover:bg-[#FEE2E2]/50 shrink-0">
                  <i class="ph ph-trash text-base"></i>
                </button>
              </ng-container>
              <ng-template #confirmSubTpl>
                <div class="flex items-center gap-1 shrink-0">
                  <button type="button" (click)="confirmRemove('subcategorias', sub.id)" class="px-2 py-1 rounded bg-[#B91C1C] text-white text-[11px] font-semibold">Sí</button>
                  <button type="button" (click)="confirmKey = ''" class="px-2 py-1 rounded bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold">No</button>
                </div>
              </ng-template>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class ConfiguracionPageComponent implements OnInit {
  private catalogsService = inject(CatalogsService);
  private toast = inject(ToastService);

  catalogs: CatalogsBundle | null = null;
  categoriaId = 0;
  confirmKey = '';
  errorMsg = '';
  nombres: Record<CatalogType, string> = { sedes: '', categorias: '', subcategorias: '' };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.catalogsService.getAllCatalogs().subscribe((res) => {
      this.catalogs = res;
      if (!this.categoriaId && res.categorias.length) this.categoriaId = res.categorias[0].id;
    });
  }

  categoriaNombre(id: number): string {
    return this.catalogs?.categorias.find((c) => c.id === id)?.nombre ?? '';
  }

  add(type: CatalogType): void {
    const nombre = this.nombres[type].trim();
    if (!nombre) return;
    this.errorMsg = '';
    const catId = type === 'subcategorias' ? this.categoriaId : undefined;
    this.catalogsService.createCatalogItem(type, nombre, catId).subscribe({
      next: () => {
        this.nombres[type] = '';
        this.toast.show('Elemento agregado');
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.detail || 'Error al agregar';
        this.errorMsg = msg;
        this.toast.show(msg, 'error');
      },
    });
  }

  askRemove(type: CatalogType, id: number): void {
    this.errorMsg = '';
    this.confirmKey = `${type}-${id}`;
  }

  confirmRemove(type: CatalogType, id: number): void {
    this.confirmKey = '';
    this.errorMsg = '';
    this.catalogsService.deleteCatalogItem(type, id).subscribe({
      next: () => {
        this.toast.show('Elemento eliminado correctamente');
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.detail || 'No se puede eliminar porque está asociado a tickets existentes.';
        this.errorMsg = msg;
        this.toast.show(msg, 'error');
      },
    });
  }
}
