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
  template: `
    <div class="space-y-6 fade-entry">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Bitácora mensual</span>
          <h2 class="text-2xl font-bold text-[#1E293B] mt-0.5">Informe de Actividades</h2>
          <p *ngIf="report" class="text-xs text-[#64748B] mt-1">{{ report.nombre_completo }} · {{ report.mes_legible }} · {{ report.total_actividades }} registros</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input type="month" [(ngModel)]="mes" (change)="load()" class="input-minimal w-40 font-mono-code text-xs" />
          <select *ngIf="auth.isAdmin()" [(ngModel)]="userId" (change)="load()" class="input-minimal w-48 text-xs">
            <option *ngFor="let u of users" [ngValue]="u.id">{{ u.nombre }}</option>
          </select>
          <button (click)="export('docx')" class="btn-secondary-minimal text-xs inline-flex items-center gap-1.5">
            <i class="ph ph-file-doc text-base"></i> Word
          </button>
          <button (click)="export('pdf')" class="btn-primary-minimal text-xs inline-flex items-center gap-1.5">
            <i class="ph ph-file-pdf text-base"></i> PDF
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bento-card space-y-4 h-fit" *ngIf="isOwnReport()">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono-code uppercase tracking-wider text-[#64748B]">
              {{ editingId ? 'Editar actividad' : 'Registrar actividad del día' }}
            </h3>
            <span class="badge-pill badge-blue">Semana {{ week(form.fecha) }}</span>
          </div>

          <!-- Selector rápido de actividades guardadas -->
          <div class="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[#475569] flex items-center gap-1">
                <i class="ph-bold ph-bookmarks text-[#2B95D6]"></i> Actividades guardadas
              </span>
              <span class="text-[11px] font-mono-code text-[#64748B]">{{ templates.length }}</span>
            </div>

            <div class="flex gap-1.5" *ngIf="templates.length > 0; else emptyTemplates">
              <select [(ngModel)]="selectedTemplateId" name="selectedTemplateId" (ngModelChange)="applyTemplate($event)" class="input-minimal text-xs py-1.5">
                <option value="">Elegir actividad guardada…</option>
                <option *ngFor="let tpl of templates" [value]="tpl.id">
                  {{ tpl.actividad.length > 48 ? (tpl.actividad | slice:0:48) + '…' : tpl.actividad }}
                </option>
              </select>
              <button *ngIf="selectedTemplateId" type="button" (click)="deleteTemplate(selectedTemplateId)" title="Eliminar plantilla guardada"
                      class="px-2.5 rounded-md border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#B91C1C] hover:border-[#FECACA]">
                <i class="ph ph-trash text-sm"></i>
              </button>
            </div>
            <ng-template #emptyTemplates>
              <p class="text-[11px] text-[#64748B]">Guarda tus actividades frecuentes para llenarlas en 1 clic y solo montar la foto.</p>
            </ng-template>
          </div>

          <form (ngSubmit)="save()" class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1">Fecha *</label>
              <input type="date" [(ngModel)]="form.fecha" name="fecha" class="input-minimal font-mono-code text-xs" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-medium">Actividad *</label>
                <button type="button" (click)="saveCurrentAsTemplate()"
                        class="text-[11px] font-semibold text-[#2B95D6] hover:underline inline-flex items-center gap-1">
                  <i class="ph ph-bookmark-simple"></i> Guardar actividad
                </button>
              </div>
              <textarea [(ngModel)]="form.actividad" name="actividad" rows="3" class="input-minimal" placeholder="Ej: Mantenimiento preventivo de equipos…"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Entregable *</label>
              <textarea [(ngModel)]="form.entregable" name="entregable" rows="2" class="input-minimal" placeholder="Ej: Acta firmada, equipos operativos…"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Foto de evidencia {{ editingId ? '(opcional, reemplaza)' : '' }}</label>
              <input #photoInput type="file" accept="image/*" (change)="onPhoto($event)" class="input-minimal text-xs" />
              <img *ngIf="preview" [src]="preview" alt="Vista previa" class="mt-2 w-full h-32 object-cover rounded border border-[#E2E8F0]" />
            </div>

            <label *ngIf="!editingId" class="flex items-center gap-2 text-xs text-[#475569] pt-0.5 cursor-pointer">
              <input type="checkbox" [(ngModel)]="saveAsTemplateOnSubmit" name="saveAsTemplateOnSubmit" />
              Guardar también en "Actividades guardadas"
            </label>

            <div class="flex gap-2 pt-2">
              <button *ngIf="editingId" type="button" (click)="reset()" class="btn-secondary-minimal flex-1">Cancelar</button>
              <button type="submit" [disabled]="saving" class="btn-primary-minimal flex-1 inline-flex items-center justify-center gap-1.5">
                <i class="ph ph-floppy-disk"></i> {{ saving ? 'Guardando…' : (editingId ? 'Actualizar' : 'Agregar') }}
              </button>
            </div>
          </form>
        </div>

        <div [class]="isOwnReport() ? 'lg:col-span-2' : 'lg:col-span-3'" class="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-x-auto">
          <table class="table-hd">
            <thead>
              <tr>
                <th class="w-28 border-r border-[#E2E8F0]">Semana</th>
                <th>Actividad</th>
                <th class="w-40">Evidencia</th>
                <th>Entregable</th>
                <th class="w-28 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let w of weeks">
                <tr *ngFor="let item of rows(w); let i = index">
                  <td *ngIf="i === 0" [attr.rowspan]="rows(w).length" class="font-mono-code text-xs font-semibold align-middle bg-[#F8FAFC] border-r border-[#E2E8F0]">
                    Semana {{ w }}
                  </td>
                  <td class="align-top">
                    <span class="font-mono-code text-xs text-[#64748B] block mb-1">{{ item.fecha_registro }}</span>
                    <p class="whitespace-pre-line text-[#1E293B]">{{ item.actividad }}</p>
                  </td>
                  <td class="align-top">
                    <a *ngIf="item.evidencia_foto_url" [href]="auth.getAssetUrl(item.evidencia_foto_url)" target="_blank">
                      <img [src]="auth.getAssetUrl(item.evidencia_foto_url)" alt="Evidencia" class="w-28 h-20 object-cover rounded border border-[#E2E8F0]" />
                    </a>
                    <span *ngIf="!item.evidencia_foto_url" class="text-xs text-[#64748B] italic">Sin foto</span>
                  </td>
                  <td class="align-top whitespace-pre-line text-[#334155]">{{ item.entregable }}</td>
                  <td class="align-top text-right whitespace-nowrap">
                    <ng-container *ngIf="confirmDeleteId !== item.id; else confirmDelTpl">
                      <button *ngIf="isOwnReport()" (click)="reuseFromRow(item)" title="Repetir esta actividad (solo montar foto)" class="p-1.5 text-[#64748B] hover:text-[#2B95D6]">
                        <i class="ph ph-copy text-base"></i>
                      </button>
                      <button (click)="edit(item)" title="Editar" class="p-1.5 text-[#64748B] hover:text-[#2B95D6]"><i class="ph ph-pencil-simple text-base"></i></button>
                      <button (click)="confirmDeleteId = item.id" title="Eliminar" class="p-1.5 text-[#64748B] hover:text-[#B91C1C]"><i class="ph ph-trash text-base"></i></button>
                    </ng-container>
                    <ng-template #confirmDelTpl>
                      <div class="inline-flex items-center gap-1">
                        <button type="button" (click)="remove(item)" class="px-2 py-1 rounded bg-[#B91C1C] text-white text-[11px] font-semibold">Sí</button>
                        <button type="button" (click)="confirmDeleteId = null" class="px-2 py-1 rounded bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold">No</button>
                      </div>
                    </ng-template>
                  </td>
                </tr>
              </ng-container>
              <tr *ngIf="!report?.total_actividades">
                <td colspan="5" class="py-12 text-center text-sm text-[#64748B]">No hay actividades registradas en este mes.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
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
