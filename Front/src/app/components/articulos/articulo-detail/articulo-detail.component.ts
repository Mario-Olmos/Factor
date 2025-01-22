// article-detail.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Article } from '../../../models/article.model';
import { ActivatedRoute } from '@angular/router';
import { ArticlesService } from '../../../services/articles.service';
import { AuthService } from '../../../services/auth.service';
import { UserProfile } from '../../../models/user.model';
import { SharedService } from '../../../services/shared.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-articulo-detail',
  templateUrl: './articulo-detail.component.html',
  styleUrls: ['./articulo-detail.component.css']
})
export class ArticuloDetailComponent implements OnInit {
  @ViewChild('pdfIframe') pdfIframe!: ElementRef;
  currentUser: UserProfile | null = null;
  errorMessage: string = '';
  article: Article | null = null;
  pdfSrc!: SafeResourceUrl;
  popupMessage: string = '';
  popupType: 'success' | 'error' | '' = '';

  constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private authService: AuthService,
    private sharedService: SharedService,
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
      this.loadArticle(articleId);
    } else {
      this.errorMessage = 'ID del artículo no válido.';
    }
  }

  /**
   * Cargamos información del artículo.
   * @param articleId ID del artículo a votar.
   * @param userId Id del autor del artículo.
   */
  private loadArticle(articleId: string): void {
    this.articlesService.getArticleById(articleId).subscribe(
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
        this.showErrorMessage('No se pudo cargar el artículo.');
      }
    );
  }

  /**
 * Maneja el voto en un artículo.
 * @param articleId ID del artículo a votar.
 * @param voteType Tipo de voto ('upvote' o 'downvote').
 */
  public votarArticulo(articleId: string, voteType: 'upvote' | 'downvote'): void {
    if (!this.currentUser) {
      this.showErrorMessage('Debes estar logueado para votar.');
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
      voteType: voteType
    };

    this.articlesService.votarArticulo(payload).subscribe(
      (response: any) => {
        const message = voteType === 'upvote'
          ? (response.message || '¡Voto positivo registrado con éxito!')
          : (response.message || '¡Voto negativo registrado con éxito!');
        this.showSuccessMessage(message);
        this.actualizarVotos(voteType, pesoVoto);
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
   * Actualiza los votos y la veracidad del artículo.
   * @param tipoVoto Tipo de voto ('upvote' o 'downvote').
   * @param pesoVoto Peso del voto calculado.
   */
  private actualizarVotos(tipoVoto: 'upvote' | 'downvote', pesoVoto: number): void {
    if (tipoVoto === 'upvote') {
      this.article!.upVotes += 1;
      this.article!.userVote = 'upvote';
      this.article!.veracity += pesoVoto;
    } else {
      this.article!.downVotes += 1;
      this.article!.userVote = 'downvote';
      this.article!.veracity -= pesoVoto;
    }

    this.article = { ...this.article } as Article;
  }

  /**
   * Configuramos la pantalla completa para diferentes navegadores
   */
  public toggleFullScreen() {
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

  /**
   * Configuramos la url de la fuente del artículo
   * @param sourceUrl String url de la fuente del artículo
   */
  public getSourceDisplayName(sourceUrl: string): string {
    try {
      const url = new URL(sourceUrl);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return sourceUrl;
    }
  }

  /**
   * Métodos auxiliares
   */
  public puedeVotar(reputation: number): boolean {
    return this.sharedService.puedeVotar(reputation);
  }

  public getVeracityColor(veracity: number): string {
    return this.sharedService.getVeracityColor(veracity);
  }

  public getReputationDescription(reputation: number): string {
    return this.sharedService.getReputationDescription(reputation);
  }

  public getReputationColor(reputation: number): string {
    return this.sharedService.getReputationColor(reputation);
  }

  /**
   * Mensajes
   */
  private showSuccessMessage(message: string): void {
    this.popupMessage = message;
    this.popupType = 'success';
  }

  private showErrorMessage(message: string): void {
    this.popupMessage = message;
    this.popupType = 'error';
  }

  public onPopUpClosed(): void {
    this.popupMessage = '';
    this.popupType = '';
  }
}
