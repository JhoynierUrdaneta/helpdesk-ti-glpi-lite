export interface User {
  id: number;
  nombre: string;
  usuario: string;
  rol: 'ADMIN' | 'USER';
  activo: boolean;
  must_change_password: boolean;
  temp_password?: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  must_change_password: boolean;
  user: User;
}
