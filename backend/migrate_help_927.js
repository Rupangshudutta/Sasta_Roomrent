const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sasta_room',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  try {
    console.log('--- Migration Started ---');
    
    // 1. Create Table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS help_articles (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        category    VARCHAR(100) NOT NULL,
        title       VARCHAR(255) NOT NULL,
        content     TEXT NOT NULL,
        is_popular  TINYINT(1) DEFAULT 0,
        read_time   INT DEFAULT 5,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_help_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Table "help_articles" ensured.');

    // 2. Clear existing (to ensure fresh seed as requested)
    await conn.execute('DELETE FROM help_articles');
    console.log('🗑️  Existing articles cleared for fresh seed.');

    // 3. Seed Data
    const articles = [
      ['Payments & Pricing', 'How to pay using UPI', 'To pay using UPI, simply select the UPI option at checkout. Enter your UPI ID (e.g., yourname@bank) and you will receive a payment request in your UPI app (like GPay, PhonePe, or Paytm). Open the app and approve the transaction to confirm your booking.', 1, 3],
      ['Payments & Pricing', 'Security of your transactions', 'Sasta Room takes your security seriously. All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We never store your full card details or CVV on our servers. Your connection to our site is encrypted with SSL.', 0, 5],
      ['Payments & Pricing', 'Refund policy for cancellations', 'If you cancel your booking 48 hours before the scheduled check-in, you are eligible for a 100% refund. For cancellations within 24-48 hours, a 50% fee may apply. No refunds are provided for cancellations made less than 24 hours before check-in.', 1, 4],
      ['Payments & Pricing', 'Understanding service charges', 'The rent amount you see on the listing is usually inclusive of basic maintenance. However, some owners may charge extra for electricity or water meter readings. Always check the property description for a breakdown of all charges.', 0, 4],
      ['Payments & Pricing', 'Common payment failure reasons', 'Payments can fail due to several reasons: insufficient funds, bank server downtime, or incorrect UPI PIN. If your amount is debited but the booking is not confirmed, the amount is usually auto-refunded within 5-7 working days by your bank.', 0, 5],
      ['Payments & Pricing', 'How to download your payment receipt', 'After a successful payment, you can find your receipt in the "My Bookings" section of your dashboard. Each booking has a "Download Receipt" button that generates a PDF for your records.', 0, 3],
      
      ['Finding a Room', 'Search tips for better results', 'Use the filters on the side of the property list to narrow down by budget, room type (shared/private), and amenities. You can also use the map view to find rooms near your workplace or university.', 1, 3],
      ['Finding a Room', 'What to look for during a property visit', 'When visiting a room, check for proper ventilation, water supply, and mobile network strength. Ask the owner about guest policies, curfew times (if any), and how electricity bills are calculated.', 0, 6],
      
      ['Listing a Property', 'Optimizing your listing for quick tenants', 'A great listing starts with clear photos. High-quality images of the room, kitchen, and bathroom significantly increase tenant interest. Be honest in your description and mention nearby landmarks like metro stations or malls.', 1, 5],
      ['Listing a Property', 'How to handle tenant inquiries', 'Response time is key! Aim to reply to inquiries within 2 hours. Be prepared to answer questions about guest policies, parking, and security deposits. You can schedule visits directly through our platform.', 0, 4],
      ['Listing a Property', 'Required documents for property verification', 'To ensure trust, we require owners to upload basic property documents like an electricity bill or tax receipt. We also require a valid government ID (Aadhar/PAN). Listings with "Verified" badges get 3x more views.', 1, 4],
      
      ['Safety & Trust', 'How Sasta Room verifies listings', 'We perform multi-level verification including phone verification, document checks, and sometimes physical spot checks by our local team. Look for the blue "Verified" badge on listings for maximum safety.', 1, 5],
      ['Safety & Trust', 'Reporting a suspicious listing', 'If you find a listing with unrealistic prices or suspicious owner behavior (e.g., asking for advance payment outside the platform), please use the "Report" button. Our safety team will investigate and take action within 24 hours.', 0, 4]
    ];

    const sql = 'INSERT INTO help_articles (category, title, content, is_popular, read_time) VALUES ?';
    await conn.query(sql, [articles]);
    
    console.log('✅ help_articles seeded with ' + articles.length + ' articles.');
    console.log('--- Migration Finished ---');
  } catch (err) {
    console.error('❌ Error during migration:', err);
  } finally {
    await conn.end();
  }
})();
