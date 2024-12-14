import { Component, Input, OnInit } from '@angular/core';
import { Article } from '../../../models/article.model';
import { ArticlesService } from '../../../services/articles.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-article-list',
  templateUrl: './articulo-list.component.html',
  styleUrls: ['./articulo-list.component.css']
})
export class ArticuloListComponent implements OnInit {
  @Input() articles: Article[] = [];
  @Input() currentUser!: User | null;

  constructor(private articlesService: ArticlesService, private authService: AuthService) { }

  ngOnInit(): void {
  }

  puedeVotar(): boolean {
    return this.currentUser!.reputacion >= 50;
  }

  darLike(articleId: String): void {
    if (!this.puedeVotar()) {
      alert('No tienes suficiente reputación para votar');
      return;
    }
    const likeObject = {
      articleId,
      user: this.currentUser?.userId,
      voteType: 'upvote'
    };
    this.articlesService.darLike(likeObject).subscribe();
  }

  darDislike(articleId: String): void {
    if (!this.puedeVotar()) {
      alert('No tienes suficiente reputación para votar');
      return;
    }
    const dislikeObject = {
      articleId,
      user: this.currentUser?.userId,
      voteType: 'downvote'
    };
    this.articlesService.darDislike(dislikeObject).subscribe();
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
}
