import { query, execute } from '../config/database';
import { Property, PropertyImage, CreatePropertyDto, PropertyFilters, PropertyListItem } from '../models/property.model';
import { createError } from '../middleware/error.middleware';

// ---------------------------------------------------------------------------
// List & Search
// ---------------------------------------------------------------------------
export async function getProperties(filters: PropertyFilters): Promise<{ properties: PropertyListItem[]; total: number }> {
  console.log('\n[Backend] --------------------------------------------------');
  console.log('[Backend] 📥 getProperties called with filters:', filters);
  
  try {
    const conditions: string[] = ['p.status = "active"'];
    const params: unknown[] = [];

    if (filters.city) { conditions.push('p.city LIKE ?'); params.push(`%${filters.city}%`); }
    if (filters.state) { conditions.push('p.state = ?'); params.push(filters.state); }
    if (filters.property_type) { conditions.push('p.property_type = ?'); params.push(filters.property_type); }
    if (filters.min_rent) { conditions.push('p.rent_amount >= ?'); params.push(filters.min_rent); }
    if (filters.max_rent) { conditions.push('p.rent_amount <= ?'); params.push(filters.max_rent); }
    if (filters.furnishing) { conditions.push('p.furnishing = ?'); params.push(filters.furnishing); }
    if (filters.bedrooms) { conditions.push('p.bedrooms >= ?'); params.push(filters.bedrooms); }
    if (filters.search) {
      conditions.push('(p.title LIKE ? OR p.address_line1 LIKE ? OR p.city LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    const where = conditions.join(' AND ');
    const page   = Number(filters.page  || 1);
    const limit  = Math.min(Number(filters.limit || 12), 50);
    const offset = (page - 1) * limit;

    console.log(`[Backend] 🔍 Constructed WHERE clause: ${where}`);
    console.log(`[Backend] 🔢 Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    console.log(`[Backend] 🎯 Query Params array:`, params);

    const [countRow] = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM properties p WHERE ${where}`,
      params
    );

    const properties = await query<PropertyListItem>(
      `SELECT p.*, 
         CONCAT(u.first_name, ' ', u.last_name) AS owner_name,
         (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_primary = 1 LIMIT 1) AS primary_image
       FROM properties p
       LEFT JOIN users u ON u.id = p.owner_id
       WHERE ${where}
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    console.log(`[Backend] ✅ Fetched ${properties.length} properties. Total in DB: ${countRow?.total || 0}`);
    console.log('[Backend] --------------------------------------------------\n');

    return { properties, total: countRow?.total || 0 };
  } catch (error: any) {
    console.error('[Backend] ❌ Error in getProperties:', error);
    console.error('[Backend] 📊 Error details:', {
      message: error.message,
      stack: error.stack,
      filters: filters
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Single property with images & amenities
// ---------------------------------------------------------------------------
export async function getPropertyById(id: number): Promise<Property> {
  const [property] = await query<Property>(
    `SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS owner_name
     FROM properties p
     LEFT JOIN users u ON u.id = p.owner_id
     WHERE p.id = ? AND p.status != 'inactive'`,
    [id]
  );
  if (!property) throw createError('Property not found', 404);

  // Increment view count
  await execute('UPDATE properties SET views_count = views_count + 1 WHERE id = ?', [id]);

  const images = await query<PropertyImage>(
    'SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order ASC',
    [id]
  );

  const amenityRows = await query<{ amenity: string }>(
    'SELECT amenity FROM property_amenities WHERE property_id = ?',
    [id]
  );

  property.images = images;
  property.amenities = amenityRows.map((r) => r.amenity);

  return property;
}

// ---------------------------------------------------------------------------
// Owner: get their properties
// ---------------------------------------------------------------------------
export async function getOwnerProperties(ownerId: number): Promise<Property[]> {
  return query<Property>(
    `SELECT p.*,
       (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_primary = 1 LIMIT 1) AS primary_image
     FROM properties p WHERE p.owner_id = ?
     ORDER BY p.created_at DESC`,
    [ownerId]
  );
}

// ---------------------------------------------------------------------------
// Create with Images
// ---------------------------------------------------------------------------
export async function createPropertyWithImages(ownerId: number, data: any): Promise<Property> {
  const { images, amenities, ...propertyData } = data;
  
  const result = await execute(
    `INSERT INTO properties
       (owner_id, title, description, property_type, rent_amount, security_deposit,
        address_line1, address_line2, city, state, pincode, latitude, longitude,
        bedrooms, bathrooms, furnishing, available_from, min_lease_months, max_occupancy, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      ownerId, propertyData.title, propertyData.description || null, propertyData.property_type,
      propertyData.rent_amount, propertyData.security_deposit || 0,
      propertyData.address_line1, propertyData.address_line2 || null,
      propertyData.city, propertyData.state, propertyData.pincode || null,
      propertyData.latitude || null, propertyData.longitude || null,
      propertyData.bedrooms || 1, propertyData.bathrooms || 1, propertyData.furnishing || 'unfurnished',
      propertyData.available_from || null, propertyData.min_lease_months || 1, propertyData.max_occupancy || 1,
    ]
  );

  const propertyId = result.insertId;

  // Add amenities
  if (amenities && amenities.length > 0) {
    for (const amenity of amenities) {
      await execute('INSERT INTO property_amenities (property_id, amenity) VALUES (?, ?)', [propertyId, amenity]);
    }
  }

  // Add images
  if (images && images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      await execute(
        'INSERT INTO property_images (property_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
        [propertyId, image.url, image.isPrimary ? 1 : 0, i]
      );
    }
  }

  return getPropertyById(propertyId);
}

// ---------------------------------------------------------------------------
// Create (Legacy)
// ---------------------------------------------------------------------------
export async function createProperty(ownerId: number, dto: CreatePropertyDto): Promise<Property> {
  const result = await execute(
    `INSERT INTO properties
       (owner_id, title, description, property_type, rent_amount, security_deposit,
        address_line1, address_line2, city, state, pincode, latitude, longitude,
        bedrooms, bathrooms, furnishing, available_from, min_lease_months, max_occupancy, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      ownerId, dto.title, dto.description || null, dto.property_type,
      dto.rent_amount, dto.security_deposit || 0,
      dto.address_line1, dto.address_line2 || null,
      dto.city, dto.state, dto.pincode || null,
      dto.latitude || null, dto.longitude || null,
      dto.bedrooms || 1, dto.bathrooms || 1, dto.furnishing || 'unfurnished',
      dto.available_from || null, dto.min_lease_months || 1, dto.max_occupancy || 1,
    ]
  );

  if (dto.amenities && dto.amenities.length > 0) {
    for (const amenity of dto.amenities) {
      await execute('INSERT INTO property_amenities (property_id, amenity) VALUES (?, ?)', [result.insertId, amenity]);
    }
  }

  return getPropertyById(result.insertId);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateProperty(id: number, ownerId: number, dto: Partial<CreatePropertyDto>): Promise<Property> {
  const [existing] = await query<Property>('SELECT id, owner_id FROM properties WHERE id = ?', [id]);
  if (!existing) throw createError('Property not found', 404);
  if (existing.owner_id !== ownerId) throw createError('Unauthorized', 403);

  const allowed = [
    'title', 'description', 'rent_amount', 'security_deposit',
    'address_line1', 'address_line2', 'city', 'state', 'pincode',
    'bedrooms', 'bathrooms', 'furnishing', 'available_from', 'min_lease_months', 'max_occupancy',
  ];

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in dto) {
      fields.push(`${key} = ?`);
      values.push((dto as Record<string, unknown>)[key]);
    }
  }

  if (fields.length > 0) {
    await execute(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  }

  if (dto.amenities) {
    await execute('DELETE FROM property_amenities WHERE property_id = ?', [id]);
    for (const amenity of dto.amenities) {
      await execute('INSERT INTO property_amenities (property_id, amenity) VALUES (?, ?)', [id, amenity]);
    }
  }

  return getPropertyById(id);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteProperty(id: number, ownerId: number, role: string): Promise<void> {
  const [existing] = await query<Property>('SELECT id, owner_id FROM properties WHERE id = ?', [id]);
  if (!existing) throw createError('Property not found', 404);
  if (role !== 'admin' && existing.owner_id !== ownerId) throw createError('Unauthorized', 403);

  await execute('UPDATE properties SET status = "inactive" WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Add/Remove image
// ---------------------------------------------------------------------------
export async function addPropertyImage(propertyId: number, imageUrl: string, isPrimary = false): Promise<void> {
  if (isPrimary) {
    await execute('UPDATE property_images SET is_primary = 0 WHERE property_id = ?', [propertyId]);
  }
  const [count] = await query<{ c: number }>('SELECT COUNT(*) AS c FROM property_images WHERE property_id = ?', [propertyId]);
  const noPrimary = !count || count.c === 0;
  await execute(
    'INSERT INTO property_images (property_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
    [propertyId, imageUrl, isPrimary || noPrimary ? 1 : 0, count?.c || 0]
  );
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------
export async function toggleFavorite(userId: number, propertyId: number): Promise<boolean> {
  const [existing] = await query<{ id: number }>(
    'SELECT id FROM favorites WHERE user_id = ? AND property_id = ?',
    [userId, propertyId]
  );

  if (existing) {
    await execute('DELETE FROM favorites WHERE user_id = ? AND property_id = ?', [userId, propertyId]);
    return false; // removed
  } else {
    await execute('INSERT INTO favorites (user_id, property_id) VALUES (?, ?)', [userId, propertyId]);
    return true; // added
  }
}

export async function getUserFavorites(userId: number): Promise<PropertyListItem[]> {
  return query<PropertyListItem>(
    `SELECT p.*,
       (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_primary = 1 LIMIT 1) AS primary_image
     FROM properties p
     INNER JOIN favorites f ON f.property_id = p.id
     WHERE f.user_id = ? AND p.status = 'active'`,
    [userId]
  );
}
