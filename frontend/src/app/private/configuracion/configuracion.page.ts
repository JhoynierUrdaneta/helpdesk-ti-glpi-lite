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
  templateUrl: './configuracion.page.html',
  styleUrl: './configuracion.page.css'
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
