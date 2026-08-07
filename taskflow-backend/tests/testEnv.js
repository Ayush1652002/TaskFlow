process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Real email sending is mocked out — tests shouldn't depend on network
// access or a real Gmail App Password to run.
jest.mock('../utils/mailer', () => jest.fn().mockResolvedValue(undefined));
