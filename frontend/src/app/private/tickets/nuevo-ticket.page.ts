import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketsService } from '../../shared/services/tickets.service';
import { CatalogsService } from '../../shared/services/catalogs.service';
import { UsersService } from '../../shared/services/users.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { CatalogsBundle, Subcategoria } from '../../shared/models/catalog.model';
import { User } from '../../shared/models/user.model';
import { PRIORIDADES } from './tickets-list.page';

@Component({
  selector: 'app-nuevo-ticket-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 fade-entry">
      <div class="flex items-center justify-between border-b border-[#EAEAEA] pb-5">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-[#787774]">Registro</span>
          <h2 class="font-editorial text-3xl text-[#111111] mt-0.5">Crear Nuevo Ticket TI</h2>
        </div>
        <a routerLink="/app/tickets" class="btn-secondary-minimal text-xs inline-flex items-center gap-1.5">
          <i class="ph ph-arrow-left"></i> Volver
        </a>
      </div>

      <form (ngSubmit)="submit()" class="bento-card space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium mb-1">Sede *</label>
            <select [(ngModel)]="form.sede_id" name="sede_id" class="input-minimal">
              <option [ngValue]="0" disabled>Seleccione sede…</option>
              <option *ngFor="let s of catalogs?.sedes" [ngValue]="s.id">{{ s.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Técnico responsable</label>
            <select [(ngModel)]="form.responsable_id" name="responsable_id" class="input-minimal">
              <option *ngFor="let u of technicians" [ngValue]="u.id">{{ u.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Categoría *</label>
            <select [(ngModel)]="form.categoria_id" name="categoria_id" (ngModelChange)="onCategoriaChange($event)" class="input-minimal">
              <option [ngValue]="0" disabled>Seleccione categoría…</option>
              <option *ngFor="let c of catalogs?.categorias" [ngValue]="c.id">{{ c.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Subcategoría *</label>
            <select [(ngModel)]="form.subcategoria_id" name="subcategoria_id" class="input-minimal" [disabled]="!subcategorias.length">
              <option [ngValue]="0" disabled>Seleccione subcategoría…</option>
              <option *ngFor="let sub of subcategorias" [ngValue]="sub.id">{{ sub.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Prioridad</label>
            <select [(ngModel)]="form.prioridad" name="prioridad" class="input-minimal">
              <option *ngFor="let p of prioridades" [value]="p">{{ p }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Impacto</label>
            <select [(ngModel)]="form.impacto" name="impacto" class="input-minimal">
              <option *ngFor="let i of impactos" [value]="i">{{ i }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Fecha de compromiso</label>
            <input type="date" [(ngModel)]="form.fecha_compromiso" name="fecha_compromiso" class="input-minimal font-mono-code" />
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Evidencia inicial</label>
            <input type="file" (change)="onFileSelected($event)" class="input-minimal text-xs" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Descripción del incidente o requerimiento *</label>
          <textarea [(ngModel)]="form.descripcion" name="descripcion" rows="4" class="input-minimal" placeholder="Describa el caso reportado…"></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Observaciones</label>
          <textarea [(ngModel)]="form.observaciones" name="observaciones" rows="2" class="input-minimal" placeholder="Notas técnicas opcionales…"></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-[#EAEAEA]">
          <a routerLink="/app/tickets" class="btn-secondary-minimal">Cancelar</a>
          <button type="submit" [disabled]="saving" class="btn-primary-minimal inline-flex items-center gap-1.5">
            <i class="ph ph-check"></i> {{ saving ? 'Guardando…' : 'Registrar ticket' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class NuevoTicketPageComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private catalogsService = inject(CatalogsService);
  private usersService = inject(UsersService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private auth = inject(AuthService);

  catalogs: CatalogsBundle | null = null;
  subcategorias: Subcategoria[] = [];
  technicians: User[] = [];
  selectedFile: File | null = null;
  saving = false;

  prioridades = PRIORIDADES;
  impactos = ['Bajo', 'Medio', 'Alto'];

  form = {
    sede_id: 0,
    categoria_id: 0,
    subcategoria_id: 0,
    prioridad: 'Media',
    impacto: 'Medio',
    fecha_compromiso: '',
    responsable_id: this.auth.getCurrentUser()?.id ?? 0,
    descripcion: '',
    observaciones: '',
  };

  ngOnInit(): void {
    this.catalogsService.getAllCatalogs().subscribe((res) => (this.catalogs = res));
    this.usersService.getTechnicians().subscribe((res) => (this.technicians = res));
  }

  onCategoriaChange(id: number): void {
    this.form.subcategoria_id = 0;
    this.subcategorias = this.catalogs?.subcategorias.filter((s) => s.categoria_id === id) ?? [];
  }

  onFileSelected(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  submit(): void {
    const f = this.form;
    if (!f.sede_id || !f.categoria_id || !f.subcategoria_id || !f.descripcion.trim()) {
      this.toast.show('Complete sede, categoría, subcategoría y descripción', 'error');
      return;
    }
    const fd = new FormData();
    fd.append('sede_id', String(f.sede_id));
    fd.append('categoria_id', String(f.categoria_id));
    fd.append('subcategoria_id', String(f.subcategoria_id));
    fd.append('prioridad', f.prioridad);
    fd.append('impacto', f.impacto);
    fd.append('descripcion', f.descripcion.trim());
    if (f.observaciones.trim()) fd.append('observaciones', f.observaciones.trim());
    if (f.fecha_compromiso) fd.append('fecha_compromiso', f.fecha_compromiso);
    if (f.responsable_id) fd.append('responsable_id', String(f.responsable_id));
    if (this.selectedFile) fd.append('evidencia', this.selectedFile);

    this.saving = true;
    this.ticketsService.createTicket(fd).subscribe({
      next: (ticket) => {
        this.toast.show(`Ticket #${ticket.id} registrado`);
        this.router.navigate(['/app/tickets', ticket.id]);
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'Error al registrar ticket', 'error');
      },
    });
  }
}
