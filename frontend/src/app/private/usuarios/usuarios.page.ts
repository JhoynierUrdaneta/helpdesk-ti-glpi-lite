import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../shared/services/users.service';
import { ToastService } from '../../shared/services/toast.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 fade-entry">
      <div class="border-b border-[#EAEAEA] pb-5">
        <span class="text-xs font-mono uppercase tracking-widest text-[#787774]">Administración</span>
        <h2 class="font-editorial text-3xl text-[#111111] mt-0.5">Personal TI</h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bento-card space-y-4 h-fit">
          <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">
            {{ editing ? 'Editar usuario #' + editing.id : 'Nuevo integrante' }}
          </h3>

          <form (ngSubmit)="save()" class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1">Nombre completo *</label>
              <input [(ngModel)]="form.nombre" name="nombre" class="input-minimal" placeholder="Juan Pérez" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Usuario (login) *</label>
              <input [(ngModel)]="form.usuario" name="usuario" class="input-minimal font-mono-code" placeholder="jperez" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Rol</label>
              <select [(ngModel)]="form.rol" name="rol" class="input-minimal">
                <option value="USER">USER (técnico)</option>
                <option value="ADMIN">ADMIN (coordinador)</option>
              </select>
            </div>

            <ng-container *ngIf="editing">
              <label class="flex items-center gap-2 text-xs"><input type="checkbox" [(ngModel)]="form.activo" name="activo" /> Cuenta activa</label>
              <label class="flex items-center gap-2 text-xs"><input type="checkbox" [(ngModel)]="form.reset_password" name="reset_password" /> Restablecer contraseña</label>
            </ng-container>

            <p class="text-[11px] text-[#787774]">La contraseña temporal es igual al usuario; se exige cambiarla en el primer ingreso.</p>

            <div class="flex gap-2 pt-2">
              <button *ngIf="editing" type="button" (click)="reset()" class="btn-secondary-minimal flex-1">Cancelar</button>
              <button type="submit" class="btn-primary-minimal flex-1 inline-flex items-center justify-center gap-1.5">
                <i class="ph ph-check"></i> {{ editing ? 'Guardar' : 'Crear usuario' }}
              </button>
            </div>
          </form>
        </div>

        <div class="lg:col-span-2 bg-white border border-[#EAEAEA] rounded-md overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[11px] font-mono uppercase text-[#787774]">
                <th class="py-3 px-4">Nombre</th>
                <th class="py-3 px-4">Usuario</th>
                <th class="py-3 px-4">Rol</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EAEAEA] text-sm">
              <tr *ngFor="let u of users" class="hover:bg-[#F7F6F3]/50">
                <td class="py-3 px-4 font-medium">{{ u.nombre }}</td>
                <td class="py-3 px-4 font-mono text-xs text-[#787774]">&#64;{{ u.usuario }}</td>
                <td class="py-3 px-4"><span class="badge-pill" [class.badge-blue]="u.rol === 'ADMIN'" [class.badge-neutral]="u.rol !== 'ADMIN'">{{ u.rol }}</span></td>
                <td class="py-3 px-4"><span class="badge-pill" [class.badge-green]="u.activo" [class.badge-red]="!u.activo">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
                <td class="py-3 px-4 text-right whitespace-nowrap">
                  <button (click)="edit(u)" class="btn-secondary-minimal py-1 px-2.5 text-xs">Editar</button>
                  <button (click)="remove(u)" title="Eliminar" class="p-1.5 text-[#787774] hover:text-[#9F2F2D]"><i class="ph ph-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class UsuariosPageComponent implements OnInit {
  private usersService = inject(UsersService);
  private toast = inject(ToastService);

  users: User[] = [];
  editing: User | null = null;
  form = { nombre: '', usuario: '', rol: 'USER', activo: true, reset_password: false };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersService.getUsers().subscribe((res) => (this.users = res));
  }

  edit(u: User): void {
    this.editing = u;
    this.form = { nombre: u.nombre, usuario: u.usuario, rol: u.rol, activo: u.activo, reset_password: false };
  }

  reset(): void {
    this.editing = null;
    this.form = { nombre: '', usuario: '', rol: 'USER', activo: true, reset_password: false };
  }

  save(): void {
    if (!this.form.nombre.trim() || !this.form.usuario.trim()) {
      this.toast.show('Nombre y usuario son obligatorios', 'error');
      return;
    }
    const req$ = this.editing
      ? this.usersService.updateUser(this.editing.id, this.form)
      : this.usersService.createUser({ nombre: this.form.nombre, usuario: this.form.usuario, rol: this.form.rol });

    req$.subscribe({
      next: () => {
        this.toast.show(this.editing ? 'Usuario actualizado' : 'Usuario creado');
        this.reset();
        this.load();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'Error al guardar usuario', 'error'),
    });
  }

  remove(u: User): void {
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return;
    this.usersService.deleteUser(u.id).subscribe({
      next: () => {
        this.toast.show('Usuario eliminado');
        this.load();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'No se puede eliminar', 'error'),
    });
  }
}
