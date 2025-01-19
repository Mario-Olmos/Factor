import { UserArticle } from './user.model';

export type UserVote = 'up' | 'down' | 'none';

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
  source: string;
  themes: {
    nivel1: string | null;
    nivel2: string | null;
    nivel3: string | null;
  };
}
    