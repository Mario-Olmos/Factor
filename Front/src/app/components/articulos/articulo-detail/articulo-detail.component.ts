import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Article } from '../../../models/article.model';
import { User } from '../../../models/user.model';
import { ActivatedRoute } from '@angular/router';
import { ArticlesService } from '../../../services/articles.service';
import { AuthService } from '../../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-articulo-detail',
  templateUrl: './articulo-detail.component.html',
  styleUrl: './articulo-detail.component.css'
})
export class ArticuloDetailComponent implements OnInit {
  @ViewChild('pdfIframe') pdfIframe!: ElementRef;
  currentUser: User | null = null;
  errorMessage: string = '';
  article: Article | null = null;
  pdfSrc!: any;
  successMessage: string = '';


  constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {

    this.authService.getCurrentUser().subscribe(
      (user) => {
        this.currentUser = user;
      },
      (error) => {
        console.error('Error al obtener el usuario actual:', error);
        this.errorMessage = 'Error al cargar los datos del usuario.';
      }
    );

    // Obtiene el ID del artículo de la URL y carga los datos
    const articleId = this.route.snapshot.paramMap.get('id');
    if (articleId) {
      this.loadArticle(articleId, this.currentUser!.userId);
    } else {
      this.errorMessage = 'ID del artículo no válido.';
    }
  }

  //Cargamos información del artículo
  private loadArticle(articleId: string, userId: string): void {
    this.articlesService.getArticleById(articleId, userId).subscribe(
      (article: any) => {

        if (article.createdAt) {
          article.createdAt = new Date(article.createdAt);
        }

        this.article = article;
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
          `http://localhost:3000/api${this.article?.pdfUrl}`
        );
        console.log(this.currentUser);
        console.log(this.pdfSrc);
        console.log(this.article);
      },
      (error: any) => {
        console.error('Error al cargar el artículo:', error);
        this.errorMessage = 'No se pudo cargar el artículo.';
      }
    );
  }

  // Cambia el color de la veracidad en funcion a su valor
  getVeracityColor(veracity: number): string {
    if (veracity < 5) {
      return '#FF4D4D';
    } else if (veracity < 7) {
      return '#FFC107';
    } else {
      return '#4CAF50';
    }
  }

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
      user: this.currentUser.userId, 
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

  toggleFullScreen() {
    const iframeElement = this.pdfIframe.nativeElement;

    if (iframeElement.requestFullscreen) {
      iframeElement.requestFullscreen();
    } else if (iframeElement.mozRequestFullScreen) { /* Firefox */
      iframeElement.mozRequestFullScreen();
    } else if (iframeElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      iframeElement.webkitRequestFullscreen();
    } else if (iframeElement.msRequestFullscreen) { /* IE/Edge */
      iframeElement.msRequestFullscreen();
    }
  }

  getSourceDisplayName(sourceUrl: string): string {
    try {
      const url = new URL(sourceUrl);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return sourceUrl;
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
