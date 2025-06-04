import { Acreditacion } from './acreditacion.model';

export interface UserProfile {
  username: string;
  reputacion: number;
  nombre: string;
  apellidos: string;
  imagenPerfil?: string;
  email: string;
  fechaNacimiento: Date;
  acreditaciones: Acreditacion[]
}

export interface UserArticle {
  username: string;
  reputacion: number;
  nombre: string;
  apellidos: string;
  imagenPerfil?: string;
  acreditaciones: Acreditacion[]
}
