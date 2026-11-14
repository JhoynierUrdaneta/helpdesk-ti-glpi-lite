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
    <div class="space-y-6">
      <div class="border-b border-[#EAEAEA] pb-5">
        <span class="text-xs font-mono uppercase tracking-widest text-[#787774]">Administración</span>
        <h2 class="font-serif text-3xl text-[#111111] mt-0.5">Gestión de Personal TI</h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulario Crear / Editar Usuario -->
        <div class="bento-card space-y-4 h-fit">
          <h3 class="text-xs font-mono uppercase tracking-wider text-[#787774]">
            {{ editingUser ? 'Editar Usuario #' + editingUser.id : 'Nuevo Integrante TI' }}
          </h3>

          <form (ngSubmit)="saveUser()" class="space-y-3">
            <div *ngIf="!editingUser">
              <label class="block text-xs font-medium mb-1">Usuario (Login) *</label>
              <input [(ngModel)]="form.username" name="username" required class="input-minimal font-mono" placeholder="ej: jperez" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Nombre Completo *</label>
              <input [(ngModel)]="form.nombre" name="nombre" required class="input-minimal" placeholder="Juan Pérez" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">Rol en Plataforma</label>
              <select [(ngModel)]="form.rol" name="rol" class="input-minimal">
                <option value="USER">USER (Técnico TI)</option>
                <option value="ADMIN">ADMIN (Coordinador / Administrador)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1">
                {{ editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña Temporal *' }}
              </label>
              <input type="password" [(ngModel)]="form.password" name="password" [required]="!editingUser" class="input-minimal" placeholder="••••••••" />
            </div>

            <div *ngIf="editingUser" class="flex items-center gap-2 pt-1">
              <input type="checkbox" [(ngModel)]="form.activo" name="activo" id="chkActivo" />
              <label for="chkActivo" class="text-xs">Cuenta activa para iniciar sesión</label>
            </div>

            <div class="flex gap-2 pt-2">
              <button *ngIf="editingUser" type="button" (click)="cancelEdit()" class="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button type="submit" class="btn-primary flex-1 justify-center">
                <i class="ph ph-check"></i> {{ editingUser ? 'Guardar Cambios' : 'Crear Usuario' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Tabla de Usuarios -->
        <div class="lg:col-span-2 bg-white border border-[#EAEAEA] rounded-md overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[11px] font-mono uppercase text-[#787774]">
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">Nombre</th>
                <th class="py-3 px-4">Usuario</th>
                <th class="py-3 px-4">Rol</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EAEAEA] text-sm">
              <tr *ngFor="let u of users" class="hover:bg-[#F7F6F3]/50">
                <td class="py-3 px-4 font-mono text-xs">#{{ u.id }}</td>
                <td class="py-3 px-4 font-medium">{{ u.nombre }}</td>
                <td class="py-3 px-4 font-mono text-xs text-[#787774]">&#64;{{ u.username }}</td>
                <td class="py-3 px-4">
                  <span class="badge" [ngClass]="u.rol === 'ADMIN' ? 'bg-[#E1F3FE] text-[#0B5CAD]' : 'bg-[#F0EFEA] text-[#55534E]'">
                    {{ u.rol }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span class="badge" [ngClass]="u.activo ? 'bg-[#EDF3EC] text-[#1B6E30]' : 'bg-[#FDEBEC] text-[#B42318]'">
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right space-x-1">
                  <button (click)="startEdit(u)" class="btn-secondary py-1 px-2.5 text-xs">Editar</button>
                  <button (click)="deleteUser(u)" class="p-1.5 text-[#787774] hover:text-[#B42318] rounded">
                    <i class="ph ph-trash"></i>
                  </button>
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
  editingUser: User | null = null;

  form = {
    username: '',
    nombre: '',
    rol: 'USER' as 'ADMIN' | 'USER',
    password: '',
    activo: true,
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersService.listUsers().subscribe((res) => (this.users = res));
  }

  startEdit(u: User): void {
    this.editingUser = u;
    this.form = {
      username: u.username,
      nombre: u.nombre,
      rol: u.rol,
      password: '',
      activo: u.activo,
    };
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.form = { username: '', nombre: '', rol: 'USER', password: '', activo: true };
  }

  saveUser(): void {
    if (this.editingUser) {
      const payload: Record<string, unknown> = {
        nombre: this.form.nombre,
        rol: this.form.rol,
        activo: this.form.activo,
      };
      if (this.form.password.trim()) {
        payload['reset_password'] = this.form.password;
      }
      this.usersService.updateUser(this.editingUser.id, payload).subscribe({
        next: () => {
          this.toast.show('Usuario actualizado');
          this.cancelEdit();
          this.loadUsers();
        },
        error: (err) => this.toast.show(err?.error?.detail || 'Error al actualizar', 'error'),
      });
    } else {
      this.usersService.createUser(this.form).subscribe({
        next: () => {
          this.toast.show('Usuario creado exitosamente');
          this.cancelEdit();
          this.loadUsers();
        },
        error: (err) => this.toast.show(err?.error?.detail || 'Error al crear usuario', 'error'),
      });
    }
  }

  deleteUser(u: User): void {
    this.usersService.deleteUser(u.id).subscribe({
      next: () => {
        this.toast.show('Usuario eliminado');
        this.loadUsers();
      },
      error: (err) => this.toast.show(err?.error?.detail || 'No se puede eliminar', 'error'),
    });
  }
}
