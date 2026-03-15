import { Router } from 'express';

const router = Router();

/**
 * @route POST /api/contact
 * @desc Receive contact form submission
 * @access Public
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, subject, and message',
      });
    }

    // In a real application, you'd save this to the DB or send an email via SendGrid/AWS SES.
    // For now, simulating success.
    console.log(`[Contact API] Received inquiry from ${name} (${email}): ${subject}`);

    res.status(200).json({
      success: true,
      message: 'Thank you for reaching out! We will get back to you shortly.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
