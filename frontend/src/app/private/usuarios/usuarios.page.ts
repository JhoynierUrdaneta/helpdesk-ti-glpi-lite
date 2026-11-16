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
  templateUrl: './usuarios.page.html',
  styleUrl: './usuarios.page.css'
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
      next: (res) => {
        const baseMsg = this.editing ? 'Usuario actualizado' : 'Usuario creado';
        const msg = res.temp_password
          ? `${baseMsg}. Clave temporal: ${res.temp_password}`
          : baseMsg;
        this.toast.show(msg);
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
