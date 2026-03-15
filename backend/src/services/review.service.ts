import { query, execute } from '../config/database';
import { Review, CreateReviewDto } from '../models/review.model';
import { createError } from '../middleware/error.middleware';

export async function getPropertyReviews(propertyId: number): Promise<Review[]> {
  return query<Review>(
    `SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name, u.avatar_url AS reviewer_avatar
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.property_id = ? AND r.is_visible = 1
     ORDER BY r.created_at DESC`,
    [propertyId]
  );
}

export async function createReview(userId: number, dto: CreateReviewDto): Promise<Review> {
  // One review per user per property
  const [existing] = await query<{ id: number }>(
    'SELECT id FROM reviews WHERE user_id = ? AND property_id = ?',
    [userId, dto.property_id]
  );
  if (existing) throw createError('You have already reviewed this property', 409);

  const result = await execute(
    `INSERT INTO reviews (property_id, user_id, booking_id, rating, title, comment)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dto.property_id, userId, dto.booking_id || null, dto.rating, dto.title || null, dto.comment || null]
  );

  // Update property's average rating
  const [avg] = await query<{ avg_rating: number; cnt: number }>(
    'SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE property_id = ? AND is_visible = 1',
    [dto.property_id]
  );
  await execute(
    'UPDATE properties SET rating_avg = ?, rating_count = ? WHERE id = ?',
    [avg.avg_rating.toFixed(2), avg.cnt, dto.property_id]
  );

  const [review] = await query<Review>('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
  return review;
}

export async function deleteReview(reviewId: number, userId: number, role: string): Promise<void> {
  const [review] = await query<Review>('SELECT * FROM reviews WHERE id = ?', [reviewId]);
  if (!review) throw createError('Review not found', 404);
  if (role !== 'admin' && review.user_id !== userId) throw createError('Unauthorized', 403);

  await execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

  // Recompute rating
  const [avg] = await query<{ avg_rating: number; cnt: number }>(
    'SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE property_id = ? AND is_visible = 1',
    [review.property_id]
  );
  await execute(
    'UPDATE properties SET rating_avg = ?, rating_count = ? WHERE id = ?',
    [avg.avg_rating, avg.cnt, review.property_id]
  );
}
