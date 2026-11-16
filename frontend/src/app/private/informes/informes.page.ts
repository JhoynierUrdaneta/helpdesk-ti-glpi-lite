import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivitiesService } from '../../shared/services/activities.service';
import { UsersService } from '../../shared/services/users.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ActivityLog, MonthlyReport } from '../../shared/models/activity.model';
import { User } from '../../shared/models/user.model';
import { computeWeekFromDateStr } from '../../shared/utils/date-week.util';

interface SavedActivityTemplate {
  id: string;
  actividad: string;
  entregable: string;
}

const today = () => new Date().toLocaleDateString('en-CA');

@Component({
  selector: 'app-informes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes.page.html',
  styleUrl: './informes.page.css'
})
export class InformesPageComponent implements OnInit {
  private activitiesService = inject(ActivitiesService);
  private usersService = inject(UsersService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  mes = today().slice(0, 7);
  userId = this.auth.getCurrentUser()?.id ?? 0;
  users: User[] = [];
  report: MonthlyReport | null = null;
  weeks = ['1', '2', '3', '4'];

  templates: SavedActivityTemplate[] = [];
  selectedTemplateId = '';
  saveAsTemplateOnSubmit = false;

  editingId: number | null = null;
  confirmDeleteId: number | null = null;
  photo: File | null = null;
  preview: string | null = null;
  saving = false;
  form = { fecha: today(), actividad: '', entregable: '' };

  week = computeWeekFromDateStr;

  private get templatesStorageKey(): string {
    return `helpdesk_ti_activity_templates_${this.auth.getCurrentUser()?.id ?? 0}`;
  }

  ngOnInit(): void {
    this.loadTemplates();
    if (this.auth.isAdmin()) {
      this.usersService.getUsers().subscribe((res) => (this.users = res));
    }
    this.load();
  }

  private loadTemplates(): void {
    try {
      const raw = localStorage.getItem(this.templatesStorageKey);
      this.templates = raw ? JSON.parse(raw) : [];
    } catch {
      this.templates = [];
    }
  }

  private persistTemplates(): void {
    localStorage.setItem(this.templatesStorageKey, JSON.stringify(this.templates));
  }

  saveCurrentAsTemplate(silentIfExists = false): void {
    const act = this.form.actividad.trim();
    const ent = this.form.entregable.trim();
    if (!act || !ent) {
      if (!silentIfExists) {
        this.toast.show('Escribe Actividad y Entregable para guardarlos como plantilla', 'error');
      }
      return;
    }
    const exists = this.templates.some(
      (t) => t.actividad.toLowerCase() === act.toLowerCase() && t.entregable.toLowerCase() === ent.toLowerCase()
    );
    if (exists) {
      if (!silentIfExists) this.toast.show('Esta actividad ya está guardada en tus plantillas');
      return;
    }
    const tpl: SavedActivityTemplate = { id: String(Date.now()), actividad: act, entregable: ent };
    this.templates = [tpl, ...this.templates];
    this.persistTemplates();
    this.selectedTemplateId = tpl.id;
    if (!silentIfExists) this.toast.show('Actividad guardada para reutilizar');
  }

  applyTemplate(id: string): void {
    const tpl = this.templates.find((t) => t.id === id);
    if (!tpl) return;
    this.form.actividad = tpl.actividad;
    this.form.entregable = tpl.entregable;
  }

  deleteTemplate(id: string): void {
    this.templates = this.templates.filter((t) => t.id !== id);
    this.persistTemplates();
    this.selectedTemplateId = '';
    this.toast.show('Plantilla eliminada');
  }

  reuseFromRow(item: ActivityLog): void {
    this.editingId = null;
    this.form = {
      fecha: today(),
      actividad: item.actividad,
      entregable: item.entregable,
    };
    this.photo = null;
    this.preview = null;
    if (this.photoInput) this.photoInput.nativeElement.value = '';
    this.toast.show('Actividad cargada; selecciona la nueva foto y guarda');
  }

  isOwnReport(): boolean {
    return this.userId === this.auth.getCurrentUser()?.id;
  }

  rows(w: string): ActivityLog[] {
    return this.report?.semanas[w] ?? [];
  }

  load(): void {
    this.activitiesService.getMonthlyReport(this.mes, this.userId).subscribe((res) => (this.report = res));
  }

  onPhoto(event: Event): void {
    this.photo = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.preview = this.photo ? URL.createObjectURL(this.photo) : null;
  }

  edit(item: ActivityLog): void {
    this.editingId = item.id;
    this.form = { fecha: item.fecha_registro, actividad: item.actividad, entregable: item.entregable };
    this.photo = null;
    this.preview = null;
    if (this.photoInput) this.photoInput.nativeElement.value = '';
  }

  reset(): void {
    this.editingId = null;
    this.selectedTemplateId = '';
    this.saveAsTemplateOnSubmit = false;
    this.form = { fecha: today(), actividad: '', entregable: '' };
    this.photo = null;
    this.preview = null;
    if (this.photoInput) this.photoInput.nativeElement.value = '';
  }

  save(): void {
    if (!this.form.fecha || !this.form.actividad.trim() || !this.form.entregable.trim()) {
      this.toast.show('Complete fecha, actividad y entregable', 'error');
      return;
    }
    if (!this.editingId && this.saveAsTemplateOnSubmit) {
      this.saveCurrentAsTemplate(true);
    }

    const fd = new FormData();
    fd.append('fecha_registro', this.form.fecha);
    fd.append('actividad', this.form.actividad.trim());
    fd.append('entregable', this.form.entregable.trim());
    if (this.photo) fd.append('evidencia_foto', this.photo);

    const req$ = this.editingId
      ? this.activitiesService.updateActivity(this.editingId, fd)
      : this.activitiesService.createActivity(fd);

    this.saving = true;
    req$.subscribe({
      next: () => {
        this.saving = false;
        this.toast.show(this.editingId ? 'Actividad actualizada' : 'Actividad agregada');
        this.reset();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'Error al guardar actividad', 'error');
      },
    });
  }

  remove(item: ActivityLog): void {
    this.confirmDeleteId = null;
    this.activitiesService.deleteActivity(item.id).subscribe({
      next: () => {
        this.toast.show('Registro eliminado');
        this.load();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'No se pudo eliminar', 'error'),
    });
  }

  export(format: 'docx' | 'pdf'): void {
    this.activitiesService.downloadExport(format, this.mes, this.userId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Informe_Actividades_${this.mes}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.show('Error al descargar el informe', 'error'),
    });
  }
}
