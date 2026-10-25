import Pusher from 'pusher';

const pusherAppId = process.env.PUSHER_APP_ID || '';
const pusherKey = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY || '';
const pusherSecret = process.env.PUSHER_SECRET || '';
const pusherCluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

export const pusherServer =
  pusherAppId && pusherKey && pusherSecret
    ? new Pusher({
        appId: pusherAppId,
        key: pusherKey,
        secret: pusherSecret,
        cluster: pusherCluster,
        useTLS: true,
      })
    : null;

export async function triggerPusherEvent(channel: string, event: string, data: any) {
  if (pusherServer) {
    try {
      await pusherServer.trigger(channel, event, data);
    } catch (err) {
      console.warn('Pusher trigger error (skipped if credentials not provided):', err);
    }
  }
}
