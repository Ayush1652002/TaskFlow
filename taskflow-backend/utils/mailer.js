// Send transactional emails via Brevo REST API over HTTPS
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured, skipping email.');
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'TaskFlow',
          email: process.env.SENDER_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to send email via Brevo:', data.message || data);
      return;
    }

    console.log('Email sent successfully via Brevo. Message ID:', data.messageId);
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
};

module.exports = sendEmail;