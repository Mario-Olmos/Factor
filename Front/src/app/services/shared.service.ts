// shared.service.ts
import { Injectable } from '@angular/core';
import { categorizationType } from '../models/article.model';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  BACKEND_URL = 'http://localhost:3000/';

  constructor() { }

  /**
   * Calcula el peso del voto basado en la reputación del usuario.
   * @param reputacion Número de reputación del usuario.
   * @returns Peso del voto.
   */
  calcularPesoVoto(reputacion: number): number {
    const basePeso = 0.01;
    const maxPeso = 1;

    if (reputacion <= 50) {
      // Crecimiento lineal desde 0.01 hasta 0.3
      return basePeso + (0.29 * (reputacion / 50));
    } else {
      // Crecimiento con raíz cuadrada desde 0.3 hasta 1
      return 0.3 + (0.7 * Math.sqrt((reputacion - 50) / 50));
    }
  }

  /**
   * Obtiene el color de veracidad basado en el valor.
   * @param veracity Valor de veracidad del artículo.
   * @returns Color.
   */
  getVeracityColor(veracity: number): string {
    if (veracity < 5) {
      return '#FF4D4D';
    } else if (veracity < 7) {
      return '#FFC107';
    } else {
      return '#4CAF50';
    }
  }

  /**
   * Obtiene la descripción de reputación basada en el valor.
   * @param reputacion Valor de reputación del usuario.
   * @returns Descripción de reputación.
   */
  getReputationDescription(reputacion: number): string {
    if (reputacion < 50) {
      return 'Explorador';
    } else if (reputacion < 75) {
      return 'Contribuyente Activo';
    } else {
      return 'Autor Elite';
    }
  }

  /**
   * Obtiene el color de reputación basado en el valor.
   * @param reputacion Valor de reputación del usuario.
   * @returns Color.
   */
  getReputationColor(reputacion: number): string {
    if (reputacion < 50) {
      return '#FF4D4D'; // Rojo
    } else if (reputacion < 75) {
      return '#FFC107'; // Amarillo
    } else {
      return '#4CAF50'; // Verde
    }
  }

  /**
   * Obtiene la descripción de la categoría del artículo.
   * @param evaluation Valor de la categoría del artículo.
   * @returns Descripción de categoría.
   */
  getCategorizationDescription(evaluated: categorizationType): any {
    if (evaluated === 'verificado') {
      return 'Verificado';
    } else if (evaluated === 'neutro') {
      return 'Neutro';
    } else if (evaluated === 'pocoFiable') {
      return 'Poco fiable';
    } else return null;
  }

  /**
   * Obtiene el color de categoría basado en el valor.
   * @param reputacion Valor de categoría del artículo.
   * @returns Color.
   */
  getCategorizationColor(evaluated: categorizationType): any {
    if (evaluated === 'pocoFiable') {
      return '#FF4D4D'; // Rojo
    } else if (evaluated === 'neutro') {
      return '#FFC107'; // Amarillo
    } else if(evaluated === 'verificado'){
      return '#4CAF50'; // Verde
    }else return null;
  }

  /**
   * Verifica si el usuario puede votar.
   * @param reputacion Valor de reputación del usuario
   * @returns Boolean indicando si puede votar.
   */
  public puedeVotar(reputacion: number): boolean {
    return reputacion >= 15;
  }

  /**
   * Obtiene la imagen del perfil del usuario o le establece el avatar por defecto.
   * @param rel Ruta relativa de la imagen.
   * @returns URL completa de la imagen de perfil o del avatar.
   */
  public getFullImageUrl(rel: string | undefined): string {
    if (!rel) return 'assets/images/default-avatar.png';
    return this.BACKEND_URL + rel;
  }
}
