import { Router } from 'express';
import { HelpModel } from '../models/help.model';

const router = Router();

// Get all help categories with counts
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await HelpModel.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// Get popular articles
router.get('/articles/popular', async (req, res, next) => {
  try {
    const articles = await HelpModel.getPopularArticles();
    res.json({ success: true, data: articles });
  } catch (error) {
    next(error);
  }
});

// Get articles by category
router.get('/articles/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const articles = await HelpModel.getArticlesByCategory(category);
    res.json({ success: true, data: articles });
  } catch (error) {
    next(error);
  }
});

// Search articles
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    const articles = await HelpModel.searchArticles(q as string);
    res.json({ success: true, data: articles });
  } catch (error) {
    next(error);
  }
});

// Get article by ID
router.get('/articles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await HelpModel.getArticleById(Number(id));
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
});

export default router;
