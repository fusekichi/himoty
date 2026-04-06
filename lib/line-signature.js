const crypto = require('crypto');

function verifyLineSignature({ channelSecret, rawBody, signature }) {
  if (!channelSecret) {
    throw new Error('LINE_CHANNEL_SECRET is missing');
  }

  if (!signature) {
    return false;
  }

  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    throw new Error('rawBody must be a Buffer');
  }

  const expectedSignature = crypto
    .createHmac('sha256', channelSecret)
    .update(rawBody)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (_error) {
    return false;
  }
}

module.exports = {
  verifyLineSignature,
};
