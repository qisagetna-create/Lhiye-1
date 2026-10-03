import { handleSseStream } from '../src/server/supabaseServer.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return handleSseStream(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
