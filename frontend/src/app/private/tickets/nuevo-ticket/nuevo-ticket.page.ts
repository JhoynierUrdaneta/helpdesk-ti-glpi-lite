import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketsService } from '../../../shared/services/tickets.service';
import { CatalogsService } from '../../../shared/services/catalogs.service';
import { UsersService } from '../../../shared/services/users.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CatalogsBundle, Subcategoria } from '../../../shared/models/catalog.model';
import { User } from '../../../shared/models/user.model';
import { PRIORIDADES } from '../tickets-list/tickets-list.page';

@Component({
  selector: 'app-nuevo-ticket-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './nuevo-ticket.page.html',
  styleUrl: './nuevo-ticket.page.css'
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
    tipo: 'Incidente',
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
    fd.append('tipo', f.tipo);
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
