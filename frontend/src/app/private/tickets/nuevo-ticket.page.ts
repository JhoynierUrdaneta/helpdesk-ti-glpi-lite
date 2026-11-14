import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketsService } from '../../shared/services/tickets.service';
import { CatalogsService } from '../../shared/services/catalogs.service';
import { UsersService } from '../../shared/services/users.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { CatalogsResponse, Subcategoria } from '../../shared/models/catalog.model';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-nuevo-ticket-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <div class="flex items-center justify-between border-b border-[#EAEAEA] pb-5">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-[#787774]">Registro GLPI</span>
          <h2 class="font-serif text-3xl text-[#111111] mt-0.5">Crear Nuevo Ticket TI</h2>
        </div>
        <a routerLink="/app/tickets" class="btn-secondary text-xs">
          <i class="ph ph-arrow-left"></i> Volver
        </a>
      </div>

      <form (ngSubmit)="submit()" class="bento-card space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium mb-1">Sede *</label>
            <select [(ngModel)]="form.sede" name="sede" required class="input-minimal">
              <option value="" disabled>Seleccione sede...</option>
              <option *ngFor="let s of catalogs?.sedes" [value]="s.nombre">{{ s.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Técnico Responsable *</label>
            <select [(ngModel)]="form.responsable_id" name="responsable_id" [disabled]="!auth.isAdmin()" required class="input-minimal">
              <option *ngFor="let u of users" [ngValue]="u.id">{{ u.nombre }} ({{ u.rol }})</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Categoría *</label>
            <select [(ngModel)]="form.categoria" name="categoria" (change)="onCategoriaChange()" required class="input-minimal">
              <option value="" disabled>Seleccione categoría...</option>
              <option *ngFor="let c of catalogs?.categorias" [value]="c.nombre">{{ c.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Subcategoría</label>
            <select [(ngModel)]="form.subcategoria" name="subcategoria" class="input-minimal">
              <option value="">General / Sin subcategoría</option>
              <option *ngFor="let sub of filteredSubcategorias" [value]="sub.nombre">{{ sub.nombre }}</option>
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
            <label class="block text-xs font-medium mb-1">Fecha de Compromiso</label>
            <input type="date" [(ngModel)]="form.fecha_compromiso" name="fecha_compromiso" class="input-minimal font-mono" />
          </div>

          <div>
            <label class="block text-xs font-medium mb-1">Adjunto o Evidencia Inicial</label>
            <input type="file" (change)="onFileSelected($event)" class="input-minimal text-xs" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Descripción detallada del incidente o requerimiento *</label>
          <textarea [(ngModel)]="form.descripcion" name="descripcion" rows="4" required class="input-minimal" placeholder="Describa el caso reportado..."></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Observaciones iniciales</label>
          <textarea [(ngModel)]="form.observaciones" name="observaciones" rows="2" class="input-minimal" placeholder="Notas técnicas opcionales..."></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-[#EAEAEA]">
          <a routerLink="/app/tickets" class="btn-secondary">Cancelar</a>
          <button type="submit" [disabled]="saving" class="btn-primary">
            <i class="ph ph-check"></i> {{ saving ? 'Guardando...' : 'Registrar Ticket' }}
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
  auth = inject(AuthService);

  catalogs: CatalogsResponse | null = null;
  filteredSubcategorias: Subcategoria[] = [];
  users: User[] = [];
  selectedFile: File | null = null;
  saving = false;

  prioridades = ['Baja', 'Media', 'Alta', 'Crítica'];
  impactos = ['Bajo', 'Medio', 'Alto'];

  form = {
    sede: '',
    categoria: '',
    subcategoria: '',
    prioridad: 'Media',
    impacto: 'Medio',
    fecha_compromiso: '',
    responsable_id: 0,
    descripcion: '',
    observaciones: '',
  };

  ngOnInit(): void {
    const currentUser = this.auth.user();
    if (currentUser) {
      this.form.responsable_id = currentUser.id;
    }
    this.catalogsService.getCatalogs().subscribe((res) => (this.catalogs = res));
    this.usersService.listUsers().subscribe((res) => (this.users = res));
  }

  onCategoriaChange(): void {
    this.form.subcategoria = '';
    const cat = this.catalogs?.categorias.find((c) => c.nombre === this.form.categoria);
    this.filteredSubcategorias = this.catalogs?.subcategorias.filter((s) => s.categoria_id === cat?.id) || [];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  submit(): void {
    if (!this.form.sede || !this.form.categoria || !this.form.descripcion.trim()) {
      this.toast.show('Complete los campos obligatorios', 'error');
      return;
    }
    this.saving = true;
    const fd = new FormData();
    fd.append('sede', this.form.sede);
    fd.append('categoria', this.form.categoria);
    fd.append('subcategoria', this.form.subcategoria);
    fd.append('prioridad', this.form.prioridad);
    fd.append('impacto', this.form.impacto);
    fd.append('fecha_compromiso', this.form.fecha_compromiso);
    fd.append('responsable_id', String(this.form.responsable_id));
    fd.append('descripcion', this.form.descripcion);
    fd.append('observaciones', this.form.observaciones);
    if (this.selectedFile) {
      fd.append('archivo', this.selectedFile);
    }

    this.ticketsService.createTicket(fd).subscribe({
      next: (ticket) => {
        this.saving = false;
        this.toast.show(`Ticket #${ticket.id} registrado exitosamente`);
        this.router.navigate(['/app/tickets', ticket.id]);
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'Error al registrar ticket', 'error');
      },
    });
  }
}
