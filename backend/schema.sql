-- ============================================================
-- Sasta Room Rent - MySQL Database Schema
-- Run: mysql -u root -p sasta_room < schema.sql
-- ============================================================

-- Using database from connection pool

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  phone       VARCHAR(20),
  password    VARCHAR(255) NOT NULL,
  role        ENUM('customer', 'owner', 'admin') NOT NULL DEFAULT 'customer',
  avatar_url  VARCHAR(512),
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  owner_id        INT NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  property_type   ENUM('pg', 'shared_room', 'single_room', 'flat') NOT NULL,
  rent_amount     DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  address_line1   VARCHAR(255) NOT NULL,
  address_line2   VARCHAR(255),
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(100) NOT NULL,
  pincode         VARCHAR(10),
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  bedrooms        TINYINT UNSIGNED DEFAULT 1,
  bathrooms       TINYINT UNSIGNED DEFAULT 1,
  furnishing      ENUM('furnished', 'semi-furnished', 'unfurnished') DEFAULT 'unfurnished',
  available_from  DATE,
  min_lease_months TINYINT UNSIGNED DEFAULT 1,
  max_occupancy   TINYINT UNSIGNED DEFAULT 1,
  status          ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
  is_featured     TINYINT(1) DEFAULT 0,
  views_count     INT DEFAULT 0,
  rating_avg      DECIMAL(3,2) DEFAULT 0.00,
  rating_count    INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_properties_city   (city),
  INDEX idx_properties_type   (property_type),
  INDEX idx_properties_status (status),
  INDEX idx_properties_owner  (owner_id),
  INDEX idx_properties_rent   (rent_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS property_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  image_url   VARCHAR(512) NOT NULL,
  is_primary  TINYINT(1) DEFAULT 0,
  sort_order  TINYINT UNSIGNED DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_images_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROPERTY AMENITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS property_amenities (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  amenity     VARCHAR(100) NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_amenities_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  property_id     INT NOT NULL,
  customer_id     INT NOT NULL,
  check_in_date   DATE NOT NULL,
  check_out_date  DATE,
  lease_months    TINYINT UNSIGNED DEFAULT 1,
  monthly_rent    DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2) NOT NULL,
  status          ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') DEFAULT 'pending',
  cancellation_reason VARCHAR(255),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_bookings_property  (property_id),
  INDEX idx_bookings_customer  (customer_id),
  INDEX idx_bookings_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  booking_id          INT NOT NULL,
  user_id             INT NOT NULL,
  amount              DECIMAL(10,2) NOT NULL,
  payment_type        ENUM('rent', 'security_deposit', 'refund') NOT NULL,
  payment_method      ENUM('razorpay', 'upi', 'bank_transfer', 'cash') DEFAULT 'razorpay',
  status              ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
  razorpay_order_id   VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature  VARCHAR(512),
  transaction_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes               TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE RESTRICT,
  INDEX idx_payments_booking (booking_id),
  INDEX idx_payments_user    (user_id),
  INDEX idx_payments_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  user_id     INT NOT NULL,
  booking_id  INT,
  rating      TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(255),
  comment     TEXT,
  is_visible  TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE RESTRICT,
  FOREIGN KEY (booking_id)  REFERENCES bookings(id)    ON DELETE SET NULL,
  UNIQUE KEY uq_review_user_property (user_id, property_id),
  INDEX idx_reviews_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  property_id INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_favorite (user_id, property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INQUIRIES / MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  sender_id   INT NOT NULL,
  owner_id    INT NOT NULL,
  message     TEXT NOT NULL,
  is_read     TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)   REFERENCES users(id)      ON DELETE RESTRICT,
  FOREIGN KEY (owner_id)    REFERENCES users(id)      ON DELETE RESTRICT,
  INDEX idx_inquiries_owner    (owner_id),
  INDEX idx_inquiries_sender   (sender_id),
  INDEX idx_inquiries_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- HELP ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS help_articles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  category    VARCHAR(100) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  is_popular  TINYINT(1) DEFAULT 0,
  read_time   INT DEFAULT 5,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_help_category (category),
  FULLTEXT idx_help_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED: Help Articles
-- ============================================================
INSERT INTO help_articles (category, title, content, is_popular, read_time)
VALUES 
('Finding a Room', 'How to search for rooms in a specific city', 'To search for a room in a specific city, go to the homepage and use the search bar. Enter the city name and click search. You can also use the "City" filter on the properties page to narrow down your results.', 1, 3),
('Bookings', 'Understanding the booking process', 'Booking a room on Sasta Room is simple. Once you find a property you like, click "View Details", then click "Book Now". You will need to select your check-in date and duration. After payment, your booking is confirmed.', 1, 5),
('Safety & Trust', 'How to verify a property before booking', 'We recommend visiting the property in person if possible. Check the host reviews and ratings. Sasta Room also performs basic verification on all listings, look for the "Verified" badge.', 0, 4),
('Payments & Pricing', 'Cancellation and refund policy explained', 'Cancellations made 48 hours before check-in are eligible for a full refund. Cancellations made within 24 hours may incur a fee. Please check the specific property policy on the listing page.', 1, 6),
('Safety & Trust', 'How to report a fraudulent listing', 'If you encounter a listing that seems fishy or fraudulent, click the "Report" button on the property page or contact our support team immediately at support@sastaroom.com.', 0, 5),
('Payments & Pricing', 'Setting up payment methods securely', 'You can pay using UPI, Credit/Debit cards, or Net Banking. All payments are processed through our secure partner, Razorpay. We never store your card details.', 0, 4),
('Listing a Property', 'How to upload photos for your listing', 'Clear, high-quality photos increase your chances of getting tenants. Upload at least 5 photos showing the bedroom, bathroom, and common areas. Make sure the lighting is good.', 0, 3),
('Listing a Property', 'What documents are required for listing?', 'For property owners, we require a valid ID proof (Aadhar/PAN) and proof of property ownership (Utility bill or Tax receipt). These documents help us maintain trust in the community.', 1, 5),
('Account & Profile', 'How to update my phone number?', 'To update your phone number, go to your Profile settings. Click on the "Edit" icon next to your phone number, enter the new number, and verify it with the OTP sent to your new number.', 0, 2),
('Account & Profile', 'Deleting your Sasta Room account', 'We are sorry to see you go. To delete your account, please contact our support team. Note that this action is permanent and will remove all your data, including booking history and active listings.', 0, 4);

-- ============================================================
-- SEED: Default Admin User
-- Password: Admin@123 (bcrypt hash — change after first login)
-- ============================================================
INSERT INTO users (first_name, last_name, email, phone, password, role, is_verified, is_active)
VALUES (
  'Admin', 'SastaRoom',
  'admin@sastaroomrent.com',
  '9999999999',
  '$2b$10$example_hash_replace_this_with_real_bcrypt_hash',
  'admin', 1, 1
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
