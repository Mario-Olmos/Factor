import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Article } from '../../../models/article.model';
import { ArticlesService } from '../../../services/articles.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-article-list',
  templateUrl: './articulo-list.component.html',
  styleUrls: ['./articulo-list.component.css']
})
export class ArticuloListComponent implements OnChanges {
  @Input() articles: Article[] = [];
  @Input() currentUser!: User | null;
  successMessage: string = '';
  errorMessage: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['articles']) {
      console.log('Artículos recibidos en ArticleListComponent:', this.articles);

    }

    if (changes['currentUser']) {
      console.log('Usuario Actual:', this.currentUser);
    }
  }

  constructor(private articlesService: ArticlesService, private authService: AuthService) { }

  puedeVotar(): boolean {
    return this.currentUser!.reputacion >= 50;
  }

  darLike(articleId: string): void {
    if (!this.currentUser) {
      alert('Debes estar logueado para votar.');
      return;
    }

    if (!this.puedeVotar()) {
      this.showErrorMessage('No tienes suficiente reputación para votar!');
      return;
    }

    const pesoVoto = this.calcularPesoVoto(this.currentUser.reputacion);

    const payload = {
      articleId: articleId,
      pesoVoto: pesoVoto,
      user: this.currentUser.userId, // Asegúrate de que este es el campo correcto
      voteType: 'upvote'
    };

    this.articlesService.darLike(payload).subscribe(
      (response: any) => {
        this.showSuccessMessage(response.message || '¡Voto positivo registrado con éxito!');
      },
      (error: any) => {
        if (error.status === 400 && error.error.message === 'Ya has votado este artículo') {
          this.showErrorMessage('Ya has votado este artículo. No puedes votar de nuevo.');
        } else {
          this.showErrorMessage(error.error.message || 'Ocurrió un error al registrar tu voto.');
        }
      }
    );
  }

  darDislike(articleId: string): void {
    if (!this.currentUser) {
      alert('Debes estar logueado para votar.');
      return;
    }

    if (!this.puedeVotar()) {
      this.showErrorMessage('No tienes suficiente reputación para votar!');
      return;
    }

    const pesoVoto = this.calcularPesoVoto(this.currentUser.reputacion);

    const payload = {
      articleId: articleId,
      pesoVoto: pesoVoto,
      user: this.currentUser.userId, // Asegúrate de que este es el campo correcto
      voteType: 'downvote'
    };

    this.articlesService.darLike(payload).subscribe(
      (response: any) => { // Considera renombrar darLike a vote o similar para evitar confusiones
        this.showSuccessMessage(response.message || '¡Voto negativo registrado con éxito!');
      },
      (error: any) => {
        if (error.status === 400 && error.error.message === 'Ya has votado este artículo') {
          this.showErrorMessage('Ya has votado este artículo. No puedes votar de nuevo.');
        } else {
          this.showErrorMessage(error.error.message || 'Ocurrió un error al registrar tu voto.');
        }
      }
    );
  }

  calcularPesoVoto(reputacion: number): number {
    return reputacion >= 100 ? 1 : reputacion / 500;
  }

  getVeracityColor(veracity: number): string {
    if (veracity < 5) {
      return '#FF4D4D';
    } else if (veracity < 7) {
      return '#FFC107';
    } else {
      return '#4CAF50';
    }
  }

  // Método para obtener la descripción según la reputación
  getReputationDescription(reputation: number): string {
    if (reputation < 50) {
      return 'Explorador';
    } else if (reputation < 75) {
      return 'Contribuyente Activo';
    } else {
      return 'Autor Elite';
    }
  }

  // Método para obtener el color según la reputación
  getReputationColor(reputation: number): string {
    if (reputation < 50) {
      return '#FF4D4D'; // Rojo
    } else if (reputation < 75) {
      return '#FFC107'; // Amarillo
    } else {
      return '#4CAF50'; // Verde
    }
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.clearMessagesAfterDelay();
  }

  // Muestra el mensaje de error temporalmente
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.clearMessagesAfterDelay();
  }

  // Limpia los mensajes de éxito y error después de un tiempo
  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 2000);
  }
}
