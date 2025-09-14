export const ZEGO_CONFIG = {
  appID: parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || '0', 10),
  serverSecret: process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET,
  appSign: process.env.ZEGO_APP_SIGN,
};

// Generate token function (should be done on server-side in production)
