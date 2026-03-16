import { query } from '../config/database';

export interface HelpArticle {
  id: number;
  category: string;
  title: string;
  content: string;
  is_popular: boolean;
  read_time: number;
  created_at: Date;
  updated_at: Date;
}

export class HelpModel {
  static async getAllArticles(): Promise<HelpArticle[]> {
    return query<HelpArticle>('SELECT * FROM help_articles ORDER BY created_at DESC');
  }

  static async getPopularArticles(): Promise<HelpArticle[]> {
    return query<HelpArticle>('SELECT * FROM help_articles WHERE is_popular = 1 ORDER BY created_at DESC');
  }

  static async getArticlesByCategory(category: string): Promise<HelpArticle[]> {
    return query<HelpArticle>('SELECT * FROM help_articles WHERE category = ? ORDER BY created_at DESC', [category]);
  }

  static async getCategories(): Promise<{ category: string; count: number }[]> {
    return query<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM help_articles GROUP BY category'
    );
  }

  static async searchArticles(searchTerm: string): Promise<HelpArticle[]> {
    return query<HelpArticle>(
      'SELECT * FROM help_articles WHERE title LIKE ? OR content LIKE ? ORDER BY is_popular DESC',
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
  }

  static async getArticleById(id: number): Promise<HelpArticle | null> {
    const rows = await query<HelpArticle>('SELECT * FROM help_articles WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }
}
