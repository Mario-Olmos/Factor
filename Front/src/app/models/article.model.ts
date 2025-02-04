import { UserArticle } from './user.model';

export type UserVote = 'upvote' | 'downvote' | 'none';
export type categorizationType = 'verificado' | 'neutro' | 'pocoFiable' | 'none' 

export interface Article {
  _id: string;
  title: string;
  description: string;
  pdfUrl: string;
  theme: string;
  veracity: number;
  createdAt: Date;
  upVotes: number;
  downVotes: number;
  userVote: UserVote;
  authorInfo: UserArticle;
  deleted: boolean;
  source: string;
  evaluated: categorizationType,
  themes: {
    nivel1: string | null;
    nivel2: string | null;
    nivel3: string | null;
  };
}
    