import webpush from 'web-push';

/**
 * Web Push Notification Utility
 * Sends background push notifications via browser push services.
 */

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const CONTACT_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@aura.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(CONTACT_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function sendPushNotification(user, payload) {
  if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

  const results = await Promise.allSettled(
    user.pushSubscriptions.map(sub => 
      webpush.sendNotification(sub, JSON.stringify(payload))
    )
  );

  // Clean up expired subscriptions
  const failedEndpoints = results
    .filter(r => r.status === 'rejected' && (r.reason.statusCode === 410 || r.reason.statusCode === 404))
    .map((_r, i) => user.pushSubscriptions[i].endpoint);

  if (failedEndpoints.length > 0) {
    user.pushSubscriptions = user.pushSubscriptions.filter(sub => !failedEndpoints.includes(sub.endpoint));
    await user.save();
  }
}
