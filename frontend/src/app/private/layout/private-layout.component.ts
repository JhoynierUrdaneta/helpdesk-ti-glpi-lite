import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css'
})
export class PrivateLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  searchTerm = '';

  quickSearch(): void {
    const q = this.searchTerm.trim();
    this.router.navigate(['/app/tickets'], { queryParams: q ? { search: q } : {} });
  }
}
