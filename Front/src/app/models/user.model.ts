export interface User {
  userId: string;
  rol: string;
  reputacion: number;
  _id: string;
  nombre: string;
  apellidos: string;
  imagenPerfil?: string;
  email: string;
  fechaNacimiento: Date
}
