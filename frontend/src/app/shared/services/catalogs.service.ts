import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogsBundle } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogsService {
  private readonly baseUrl = `${environment.apiUrl}/api/catalogs`;

  constructor(private http: HttpClient) {}

  getAllCatalogs(): Observable<CatalogsBundle> {
    return this.http.get<CatalogsBundle>(`${this.baseUrl}/all`);
  }

  createCatalogItem(
    type: 'sedes' | 'categorias' | 'subcategorias',
    nombre: string,
    categoria_id?: number
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/${type}`, { nombre, categoria_id });
  }

  deleteCatalogItem(
    type: 'sedes' | 'categorias' | 'subcategorias',
    id: number
  ): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${type}/${id}`);
  }
}
