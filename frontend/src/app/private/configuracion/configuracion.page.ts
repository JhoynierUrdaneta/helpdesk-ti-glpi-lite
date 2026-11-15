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

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" *ngIf="catalogs">
        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Sedes</h3>
          <form (ngSubmit)="add('sedes')" class="flex gap-2">
            <input [(ngModel)]="nombres.sedes" name="sede" placeholder="Nueva sede…" class="input-minimal" />
            <button type="submit" class="btn-primary-minimal px-3"><i class="ph ph-plus"></i></button>
          </form>
          <ul class="divide-y divide-[#EAEAEA] text-sm">
            <li *ngFor="let s of catalogs.sedes" class="py-2 flex items-center justify-between">
              <span>{{ s.nombre }}</span>
              <button (click)="remove('sedes', s.id)" class="text-[#787774] hover:text-[#9F2F2D]"><i class="ph ph-trash"></i></button>
            </li>
          </ul>
        </div>

        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Categorías</h3>
          <form (ngSubmit)="add('categorias')" class="flex gap-2">
            <input [(ngModel)]="nombres.categorias" name="categoria" placeholder="Nueva categoría…" class="input-minimal" />
            <button type="submit" class="btn-primary-minimal px-3"><i class="ph ph-plus"></i></button>
          </form>
          <ul class="divide-y divide-[#EAEAEA] text-sm">
            <li *ngFor="let c of catalogs.categorias" class="py-2 flex items-center justify-between">
              <span>{{ c.nombre }} <span class="font-mono text-[11px] text-[#787774]">({{ c.subcategorias.length }})</span></span>
              <button (click)="remove('categorias', c.id)" class="text-[#787774] hover:text-[#9F2F2D]"><i class="ph ph-trash"></i></button>
            </li>
          </ul>
        </div>

        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Subcategorías</h3>
          <form (ngSubmit)="add('subcategorias')" class="space-y-2">
            <select [(ngModel)]="categoriaId" name="categoriaId" class="input-minimal">
              <option *ngFor="let c of catalogs.categorias" [ngValue]="c.id">{{ c.nombre }}</option>
            </select>
            <div class="flex gap-2">
              <input [(ngModel)]="nombres.subcategorias" name="subcategoria" placeholder="Nueva subcategoría…" class="input-minimal" />
              <button type="submit" class="btn-primary-minimal px-3"><i class="ph ph-plus"></i></button>
            </div>
          </form>
          <ul class="divide-y divide-[#EAEAEA] text-sm max-h-80 overflow-y-auto">
            <li *ngFor="let sub of catalogs.subcategorias" class="py-2 flex items-center justify-between">
              <div>
                <p>{{ sub.nombre }}</p>
                <span class="text-[11px] font-mono text-[#787774]">{{ categoriaNombre(sub.categoria_id) }}</span>
              </div>
              <button (click)="remove('subcategorias', sub.id)" class="text-[#787774] hover:text-[#9F2F2D]"><i class="ph ph-trash"></i></button>
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
    const catId = type === 'subcategorias' ? this.categoriaId : undefined;
    this.catalogsService.createCatalogItem(type, nombre, catId).subscribe({
      next: () => {
        this.nombres[type] = '';
        this.toast.show('Elemento agregado');
        this.load();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'Error al agregar', 'error'),
    });
  }

  remove(type: CatalogType, id: number): void {
    if (!confirm('¿Eliminar este elemento?')) return;
    this.catalogsService.deleteCatalogItem(type, id).subscribe({
      next: () => this.load(),
      error: (err) => this.toast.show(err?.error?.detail || 'No se puede eliminar', 'error'),
    });
  }
}
