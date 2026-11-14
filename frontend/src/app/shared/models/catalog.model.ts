export interface Sede {
  id: number;
  nombre: string;
}

export interface Subcategoria {
  id: number;
  nombre: string;
  categoria_id: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  subcategorias: Subcategoria[];
}

export interface CatalogsBundle {
  sedes: Sede[];
  categorias: Categoria[];
  subcategorias: Subcategoria[];
}
