export interface Article{
    _id: String;
    title: String;
    description: String;
    pdfUrl: String;
    author: String;
    theme: String;
    veracity: number;
    createdAt: Date;
    upVotes: number;
    downVotes: number;
    userVote: string;
  }
    