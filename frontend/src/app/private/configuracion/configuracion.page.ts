import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogsService } from '../../shared/services/catalogs.service';
import { ToastService } from '../../shared/services/toast.service';
import { CatalogsResponse } from '../../shared/models/catalog.model';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="border-b border-[#EAEAEA] pb-5">
        <span class="text-xs font-mono uppercase tracking-widest text-[#787774]">Clasificación GLPI</span>
        <h2 class="font-serif text-3xl text-[#111111] mt-0.5">Catálogos de Sedes y Categorías</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" *ngIf="catalogs">
        <!-- Columna 1: Sedes -->
        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Sedes Operativas</h3>
          <form (ngSubmit)="addSede()" class="flex gap-2">
            <input [(ngModel)]="nuevaSede" name="nuevaSede" placeholder="Nueva sede..." class="input-minimal" />
            <button type="submit" class="btn-primary px-3"><i class="ph ph-plus"></i></button>
          </form>
          <ul class="divide-y divide-[#EAEAEA] text-sm">
            <li *ngFor="let s of catalogs.sedes" class="py-2 flex items-center justify-between">
              <span>{{ s.nombre }}</span>
              <button (click)="removeSede(s.id)" class="text-[#787774] hover:text-[#B42318]">
                <i class="ph ph-trash"></i>
              </button>
            </li>
          </ul>
        </div>

        <!-- Columna 2: Categorías -->
        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Categorías TI</h3>
          <form (ngSubmit)="addCategoria()" class="flex gap-2">
            <input [(ngModel)]="nuevaCategoria" name="nuevaCategoria" placeholder="Nueva categoría..." class="input-minimal" />
            <button type="submit" class="btn-primary px-3"><i class="ph ph-plus"></i></button>
          </form>
          <ul class="divide-y divide-[#EAEAEA] text-sm">
            <li *ngFor="let c of catalogs.categorias" class="py-2 flex items-center justify-between">
              <span>{{ c.nombre }}</span>
              <button (click)="removeCategoria(c.id)" class="text-[#787774] hover:text-[#B42318]">
                <i class="ph ph-trash"></i>
              </button>
            </li>
          </ul>
        </div>

        <!-- Columna 3: Subcategorías Dependientes -->
        <div class="bento-card space-y-4">
          <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">Subcategorías</h3>
          <form (ngSubmit)="addSubcategoria()" class="space-y-2">
            <select [(ngModel)]="selectedCategoriaId" name="selectedCategoriaId" class="input-minimal">
              <option [ngValue]="0" disabled>Categoría padre...</option>
              <option *ngFor="let c of catalogs.categorias" [ngValue]="c.id">{{ c.nombre }}</option>
            </select>
            <div class="flex gap-2">
              <input [(ngModel)]="nuevaSubcategoria" name="nuevaSubcategoria" placeholder="Nueva subcategoría..." class="input-minimal" />
              <button type="submit" class="btn-primary px-3"><i class="ph ph-plus"></i></button>
            </div>
          </form>
          <ul class="divide-y divide-[#EAEAEA] text-sm max-h-80 overflow-y-auto">
            <li *ngFor="let sub of catalogs.subcategorias" class="py-2 flex items-center justify-between">
              <div>
                <p>{{ sub.nombre }}</p>
                <span class="text-[11px] font-mono text-[#787774]">{{ getCategoriaName(sub.categoria_id) }}</span>
              </div>
              <button (click)="removeSubcategoria(sub.id)" class="text-[#787774] hover:text-[#B42318]">
                <i class="ph ph-trash"></i>
              </button>
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

  catalogs: CatalogsResponse | null = null;
  nuevaSede = '';
  nuevaCategoria = '';
  nuevaSubcategoria = '';
  selectedCategoriaId = 0;

  ngOnInit(): void {
    this.loadCatalogs();
  }

  loadCatalogs(): void {
    this.catalogsService.getCatalogs().subscribe((res) => {
      this.catalogs = res;
      if (!this.selectedCategoriaId && res.categorias.length > 0) {
        this.selectedCategoriaId = res.categorias[0].id;
      }
    });
  }

  getCategoriaName(id: number): string {
    return this.catalogs?.categorias.find((c) => c.id === id)?.nombre || '';
  }

  addSede(): void {
    if (!this.nuevaSede.trim()) return;
    this.catalogsService.createSede(this.nuevaSede.trim()).subscribe({
      next: () => {
        this.nuevaSede = '';
        this.toast.show('Sede agregada');
        this.loadCatalogs();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'Error', 'error'),
    });
  }

  removeSede(id: number): void {
    this.catalogsService.deleteSede(id).subscribe(() => this.loadCatalogs());
  }

  addCategoria(): void {
    if (!this.nuevaCategoria.trim()) return;
    this.catalogsService.createCategoria(this.nuevaCategoria.trim()).subscribe({
      next: () => {
        this.nuevaCategoria = '';
        this.toast.show('Categoría agregada');
        this.loadCatalogs();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'Error', 'error'),
    });
  }

  removeCategoria(id: number): void {
    this.catalogsService.deleteCategoria(id).subscribe(() => this.loadCatalogs());
  }

  addSubcategoria(): void {
    if (!this.nuevaSubcategoria.trim() || !this.selectedCategoriaId) return;
    this.catalogsService.createSubcategoria(this.nuevaSubcategoria.trim(), this.selectedCategoriaId).subscribe({
      next: () => {
        this.nuevaSubcategoria = '';
        this.toast.show('Subcategoría agregada');
        this.loadCatalogs();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'Error', 'error'),
    });
  }

  removeSubcategoria(id: number): void {
    this.catalogsService.deleteSubcategoria(id).subscribe(() => this.loadCatalogs());
  }
}
