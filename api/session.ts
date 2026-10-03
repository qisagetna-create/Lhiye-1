import { handleSession } from '../src/server/authHandler.js';

export default async function handler(req: any, res: any) {
  return handleSession(req, res);
}
