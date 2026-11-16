import { Routes } from '@angular/router';
import { PrivateLayoutComponent } from './layout/private-layout.component';
import { PanelPageComponent } from './panel/panel.page';
import { TicketsListPageComponent } from './tickets/tickets-list/tickets-list.page';
import { NuevoTicketPageComponent } from './tickets/nuevo-ticket/nuevo-ticket.page';
import { TicketDetallePageComponent } from './tickets/ticket-detalle/ticket-detalle.page';
import { InformesPageComponent } from './informes/informes.page';
import { UsuariosPageComponent } from './usuarios/usuarios.page';
import { ConfiguracionPageComponent } from './configuracion/configuracion.page';
import { adminGuard } from '../shared/guards/admin.guard';

export const PRIVATE_ROUTES: Routes = [
  {
    path: '',
    component: PrivateLayoutComponent,
    children: [
      { path: 'panel', component: PanelPageComponent },
      { path: 'tickets', component: TicketsListPageComponent },
      { path: 'tickets/nuevo', component: NuevoTicketPageComponent },
      { path: 'tickets/:id', component: TicketDetallePageComponent },
      { path: 'informes', component: InformesPageComponent },
      { path: 'usuarios', component: UsuariosPageComponent, canActivate: [adminGuard] },
      { path: 'configuracion', component: ConfiguracionPageComponent, canActivate: [adminGuard] },
      { path: '', redirectTo: 'panel', pathMatch: 'full' },
    ],
  },
];
