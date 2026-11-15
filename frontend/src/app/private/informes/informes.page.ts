import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivitiesService } from '../../shared/services/activities.service';
import { UsersService } from '../../shared/services/users.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ActivityLog, MonthlyReport } from '../../shared/models/activity.model';
import { User } from '../../shared/models/user.model';
import { computeWeekFromDateStr } from '../../shared/utils/date-week.util';

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

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
            <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">
              {{ editingId ? 'Editar actividad' : 'Registrar actividad del día' }}
            </h3>
            <span class="badge-pill badge-blue">Semana {{ week(form.fecha) }}</span>
          </div>

          <form (ngSubmit)="save()" class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1">Fecha *</label>
              <input type="date" [(ngModel)]="form.fecha" name="fecha" class="input-minimal font-mono-code text-xs" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Actividad *</label>
              <textarea [(ngModel)]="form.actividad" name="actividad" rows="3" class="input-minimal" placeholder="Ej: Mantenimiento preventivo de equipos…"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Entregable *</label>
              <textarea [(ngModel)]="form.entregable" name="entregable" rows="2" class="input-minimal" placeholder="Ej: Acta firmada, equipos operativos…"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Foto de evidencia {{ editingId ? '(opcional, reemplaza)' : '' }}</label>
              <input type="file" accept="image/*" (change)="onPhoto($event)" class="input-minimal text-xs" />
              <img *ngIf="preview" [src]="preview" alt="Vista previa" class="mt-2 w-full h-32 object-cover rounded border border-[#EAEAEA]" />
            </div>
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
                <th class="w-24 text-right">Acciones</th>
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
                    <button (click)="edit(item)" title="Editar" class="p-1.5 text-[#64748B] hover:text-[#2B95D6]"><i class="ph ph-pencil-simple text-base"></i></button>
                    <button (click)="remove(item)" title="Eliminar" class="p-1.5 text-[#64748B] hover:text-[#B91C1C]"><i class="ph ph-trash text-base"></i></button>
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

  mes = today().slice(0, 7);
  userId = this.auth.getCurrentUser()?.id ?? 0;
  users: User[] = [];
  report: MonthlyReport | null = null;
  weeks = ['1', '2', '3', '4'];

  editingId: number | null = null;
  photo: File | null = null;
  preview: string | null = null;
  saving = false;
  form = { fecha: today(), actividad: '', entregable: '' };

  week = computeWeekFromDateStr;

  ngOnInit(): void {
    if (this.auth.isAdmin()) {
      this.usersService.getUsers().subscribe((res) => (this.users = res));
    }
    this.load();
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
  }

  reset(): void {
    this.editingId = null;
    this.form = { fecha: today(), actividad: '', entregable: '' };
    this.photo = null;
    this.preview = null;
  }

  save(): void {
    if (!this.form.fecha || !this.form.actividad.trim() || !this.form.entregable.trim()) {
      this.toast.show('Complete fecha, actividad y entregable', 'error');
      return;
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
    if (!confirm('¿Eliminar este registro?')) return;
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
