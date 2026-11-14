import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivitiesService } from '../../shared/services/activities.service';
import { UsersService } from '../../shared/services/users.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ActivityItem } from '../../shared/models/activity.model';
import { User } from '../../shared/models/user.model';
import { calculateWeekLabel, currentYearMonth, todayIsoDate } from '../../shared/utils/date-week.util';

interface WeekGroup {
  semana: string;
  items: ActivityItem[];
}

@Component({
  selector: 'app-informes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado y Botones de Exportación Word / PDF -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-[#787774]">Bitácora Mensual TI</span>
          <h2 class="font-serif text-3xl text-[#111111] mt-0.5">Informe Mensual de Actividades</h2>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input type="month" [(ngModel)]="mes" (change)="loadActivities()" class="input-minimal w-40 font-mono text-xs" />

          <select *ngIf="auth.isAdmin()" [(ngModel)]="selectedUserId" (change)="loadActivities()" class="input-minimal w-48 text-xs">
            <option *ngFor="let u of users" [ngValue]="u.id">{{ u.nombre }}</option>
          </select>

          <button (click)="exportReport('docx')" class="btn-secondary text-xs">
            <i class="ph ph-file-doc text-base"></i> Descargar Word (.docx)
          </button>

          <button (click)="exportReport('pdf')" class="btn-primary text-xs">
            <i class="ph ph-file-pdf text-base"></i> Descargar PDF (.pdf)
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulario Progresivo Día a Día -->
        <div class="bento-card space-y-4 h-fit">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">
              {{ editingId ? 'Editar Actividad #' + editingId : 'Registrar Actividad del Día' }}
            </h3>
            <span class="badge bg-[#E1F3FE] text-[#0B5CAD]">{{ previewWeek(form.fecha) }}</span>
          </div>

          <form (ngSubmit)="saveActivity()" class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1">Fecha de Ejecución *</label>
              <input type="date" [(ngModel)]="form.fecha" name="fecha" required class="input-minimal font-mono text-xs" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Actividad Realizada *</label>
              <textarea [(ngModel)]="form.actividad" name="actividad" rows="3" required class="input-minimal" placeholder="Ej: Mantenimiento preventivo de equipos en sede..."></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Entregable / Resultado *</label>
              <textarea [(ngModel)]="form.entregable" name="entregable" rows="2" required class="input-minimal" placeholder="Ej: Acta firmada y equipos operativos..."></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Foto de Evidencia {{ editingId ? '(Opcional para reemplazar)' : '*' }}</label>
              <input type="file" accept="image/*" (change)="onPhotoSelected($event)" class="input-minimal text-xs" />
            </div>

            <div class="flex gap-2 pt-2">
              <button *ngIf="editingId" type="button" (click)="cancelEdit()" class="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button type="submit" [disabled]="saving" class="btn-primary flex-1 justify-center">
                <i class="ph ph-floppy-disk"></i> {{ saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Agregar al Informe') }}
              </button>
            </div>
          </form>
        </div>

        <!-- Vista Previa Formato Oficial (Semana 1 a Semana 4) -->
        <div class="lg:col-span-2 bg-white border border-[#EAEAEA] rounded-md overflow-hidden">
          <div class="p-4 border-b border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between">
            <span class="text-xs font-mono uppercase text-[#787774]">Vista Previa del Formato de Actividades ({{ mes }})</span>
            <span class="text-xs font-mono text-[#787774]">{{ activities.length }} registros</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[11px] font-mono uppercase text-[#787774]">
                  <th class="py-3 px-4 w-28 border-r border-[#EAEAEA]">Semana</th>
                  <th class="py-3 px-4">Actividad</th>
                  <th class="py-3 px-4 w-40">Evidencia (Foto)</th>
                  <th class="py-3 px-4">Entregable</th>
                  <th class="py-3 px-4 w-24 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EAEAEA] text-sm">
                <ng-container *ngFor="let group of groupedWeeks">
                  <tr *ngFor="let item of group.items; let idx = index" class="hover:bg-[#F7F6F3]/40">
                    <td *ngIf="idx === 0" [attr.rowspan]="group.items.length"
                        class="py-3 px-4 font-mono text-xs font-semibold align-middle bg-[#FAFAFA] border-r border-[#EAEAEA]">
                      {{ group.semana }}
                    </td>
                    <td class="py-3 px-4 align-top">
                      <span class="font-mono text-[11px] text-[#787774] block mb-0.5">{{ item.fecha }}</span>
                      <p class="whitespace-pre-line">{{ item.actividad }}</p>
                    </td>
                    <td class="py-3 px-4 align-top">
                      <a *ngIf="item.evidencia_url" [href]="item.evidencia_url" target="_blank" class="block">
                        <img [src]="item.evidencia_url" alt="Evidencia" class="w-28 h-20 object-cover rounded border border-[#EAEAEA]" />
                      </a>
                      <span *ngIf="!item.evidencia_url" class="text-xs text-[#787774] italic">Sin foto</span>
                    </td>
                    <td class="py-3 px-4 align-top whitespace-pre-line">{{ item.entregable }}</td>
                    <td class="py-3 px-4 align-top text-right">
                      <div class="inline-flex gap-1">
                        <button (click)="startEdit(item)" title="Editar" class="p-1.5 text-[#787774] hover:text-[#111111] rounded hover:bg-[#EAEAEA]/60">
                          <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button (click)="removeActivity(item)" title="Eliminar" class="p-1.5 text-[#787774] hover:text-[#B42318] rounded hover:bg-[#FDEBEC]">
                          <i class="ph ph-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-container>

                <tr *ngIf="activities.length === 0">
                  <td colspan="5" class="py-12 text-center text-sm text-[#787774]">
                    No hay actividades registradas en este mes. Agregue su avance diario desde el panel izquierdo.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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

  mes = currentYearMonth();
  selectedUserId = 0;
  users: User[] = [];
  activities: ActivityItem[] = [];
  groupedWeeks: WeekGroup[] = [];

  editingId: number | null = null;
  selectedPhoto: File | null = null;
  saving = false;

  form = {
    fecha: todayIsoDate(),
    actividad: '',
    entregable: '',
  };

  ngOnInit(): void {
    const u = this.auth.user();
    if (u) this.selectedUserId = u.id;
    if (this.auth.isAdmin()) {
      this.usersService.listUsers().subscribe((res) => (this.users = res));
    }
    this.loadActivities();
  }

  previewWeek(fecha: string): string {
    return calculateWeekLabel(fecha);
  }

  loadActivities(): void {
    this.activitiesService.listActivities(this.mes, this.selectedUserId).subscribe((res) => {
      this.activities = res;
      this.buildGroups();
    });
  }

  buildGroups(): void {
    const order = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    this.groupedWeeks = order
      .map((sem) => ({
        semana: sem,
        items: this.activities.filter((a) => a.semana === sem),
      }))
      .filter((g) => g.items.length > 0);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedPhoto = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  startEdit(item: ActivityItem): void {
    this.editingId = item.id;
    this.form = {
      fecha: item.fecha,
      actividad: item.actividad,
      entregable: item.entregable,
    };
    this.selectedPhoto = null;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form = { fecha: todayIsoDate(), actividad: '', entregable: '' };
    this.selectedPhoto = null;
  }

  saveActivity(): void {
    if (!this.form.fecha || !this.form.actividad.trim() || !this.form.entregable.trim()) {
      this.toast.show('Complete fecha, actividad y entregable', 'error');
      return;
    }
    this.saving = true;
    const fd = new FormData();
    fd.append('fecha', this.form.fecha);
    fd.append('actividad', this.form.actividad);
    fd.append('entregable', this.form.entregable);
    if (this.selectedPhoto) {
      fd.append('foto', this.selectedPhoto);
    }

    const req$ = this.editingId
      ? this.activitiesService.updateActivity(this.editingId, fd)
      : this.activitiesService.createActivity(fd);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.toast.show(this.editingId ? 'Actividad actualizada' : 'Actividad agregada al informe');
        this.cancelEdit();
        this.loadActivities();
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'Error al guardar actividad', 'error');
      },
    });
  }

  removeActivity(item: ActivityItem): void {
    this.activitiesService.deleteActivity(item.id).subscribe({
      next: () => {
        this.toast.show('Registro eliminado');
        this.loadActivities();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'No se pudo eliminar', 'error'),
    });
  }

  exportReport(formato: 'docx' | 'pdf'): void {
    this.toast.show(`Generando informe en formato .${formato.toUpperCase()}...`);
    this.activitiesService.downloadReport(this.mes, formato, this.selectedUserId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Informe_Actividades_${this.mes}.${formato}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toast.show('Error al descargar el informe', 'error'),
    });
  }
}
