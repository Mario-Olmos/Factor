// articulo-list.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Article } from '../../../models/article.model';
import { ArticlesService } from '../../../services/articles.service';
import { User } from '../../../models/user.model';
import { SharedService } from '../../../services/shared.service';

@Component({
  selector: 'app-article-list',
  templateUrl: './articulo-list.component.html',
  styleUrls: ['./articulo-list.component.css']
})
export class ArticuloListComponent implements OnChanges {
  @Input() articles: Article[] = [];
  @Input() currentUser!: User | null;
  @Input() isOwnProfile: boolean = false;
  
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private articlesService: ArticlesService,
    private sharedService: SharedService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['articles']) {
      console.log('Artículos recibidos en ArticleListComponent:', this.articles);
    }

    if (changes['currentUser']) {
      console.log('Usuario Actual:', this.currentUser);
    }
  }

  /**
   * Maneja el voto positivo (like) en un artículo.
   * @param articleId ID del artículo a votar.
   */
  public darLike(articleId: string): void {
    if (!this.currentUser) {
      alert('Debes estar logueado para votar.');
      return;
    }

    if (!this.puedeVotar(this.currentUser.reputacion)) {
      this.showErrorMessage('No tienes suficiente reputación para votar!');
      return;
    }

    const pesoVoto = this.sharedService.calcularPesoVoto(this.currentUser.reputacion);

    const payload = {
      articleId: articleId,
      pesoVoto: pesoVoto,
      user: this.currentUser.userId, 
      voteType: 'upvote'
    };

    this.articlesService.darLike(payload).subscribe(
      (response: any) => {
        this.showSuccessMessage(response.message || '¡Voto positivo registrado con éxito!');
        this.actualizarVotos(articleId, 'upvote', pesoVoto); 
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

  /**
   * Maneja el voto negativo (dislike) en un artículo.
   * @param articleId ID del artículo a votar.
   */
  public darDislike(articleId: string): void {
    if (!this.currentUser) {
      alert('Debes estar logueado para votar.');
      return;
    }

    if (!this.puedeVotar(this.currentUser.reputacion)) {
      this.showErrorMessage('No tienes suficiente reputación para votar!');
      return;
    }

    const pesoVoto = this.sharedService.calcularPesoVoto(this.currentUser.reputacion);

    const payload = {
      articleId: articleId,
      pesoVoto: pesoVoto,
      user: this.currentUser.userId,
      voteType: 'downvote'
    };

    this.articlesService.darLike(payload).subscribe(
      (response: any) => { 
        this.showSuccessMessage(response.message || '¡Voto negativo registrado con éxito!');
        this.actualizarVotos(articleId, 'downvote', pesoVoto); 
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

  /**
   * Confirma y elimina un artículo.
   * @param articleId ID del artículo a eliminar.
   */
  public confirmDelete(articleId: string): void {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.');
    if (confirmacion && this.currentUser) {
      this.eliminarArticulo(articleId, this.currentUser.userId);
    }
  }

  /**
   * Elimina un artículo.
   * @param articleId ID del artículo a eliminar.
   * @param userId ID del usuario que elimina el artículo.
   */
  public eliminarArticulo(articleId: string, userId: string): void {
    this.articlesService.eliminarArticulo(articleId, userId).subscribe(
      (response: any) => {
        this.showSuccessMessage(response.message || 'Artículo eliminado con éxito.');
        this.removerArticuloDelArray(articleId); 
      },
      (error: any) => {
        this.showErrorMessage('Ocurrió un error al eliminar el artículo.');
      }
    );
  }

  /**
   * Actualiza los votos y la veracidad de un artículo en el array local.
   * @param articleId ID del artículo a actualizar.
   * @param tipoVoto Tipo de voto ('upvote' o 'downvote').
   * @param pesoVoto Peso del voto calculado.
   */
  private actualizarVotos(articleId: string, tipoVoto: 'upvote' | 'downvote', pesoVoto: number): void {
    const article = this.articles.find(a => a._id === articleId);
    if (article && this.currentUser) {
      if (tipoVoto === 'upvote') {
        article.upVotes += 1;
        article.userVote = 'upvote';
        article.veracity += pesoVoto;
      } else {
        article.downVotes += 1;
        article.userVote = 'downvote';
        article.veracity -= pesoVoto;
      }
      this.articles = [...this.articles];
    }
  }

  /**
   * Remueve un artículo del array local.
   * @param articleId ID del artículo a remover.
   */
  private removerArticuloDelArray(articleId: string): void {
    this.articles = this.articles.filter(article => article._id !== articleId);
  }


  /**
   * Métodos auxiliares
   */
  public getVeracityColor(veracity: number): string {
    return this.sharedService.getVeracityColor(veracity);
  }

  public getReputationDescription(reputation: number): string {
    return this.sharedService.getReputationDescription(reputation);
  }

  public getReputationColor(reputation: number): string {
    return this.sharedService.getReputationColor(reputation);
  }

  public puedeVotar(reputation: number): boolean {
    return this.sharedService.puedeVotar(reputation);
  }

  // Métodos para mostrar mensajes

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.clearMessagesAfterDelay();
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.clearMessagesAfterDelay();
  }

  /**
   * Limpia los mensajes de éxito y error después de 2 segundos.
   */
  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 2000);
  }
}
