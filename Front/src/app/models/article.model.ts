import { User } from './user.model';

export interface Article {
  _id: string;
  title: string;
  description: string;
  pdfUrl: string;
  author: string;
  theme: string;
  veracity: number;
  createdAt: Date;
  upVotes: number;
  downVotes: number;
  userVote: string;
  authorInfo: User;
  themes: {
    nivel1: string | null;
    nivel2: string | null;
    nivel3: string | null;
  };
}
    