import { handleChangePassword } from '../src/server/authHandler.js';

export default async function handler(req: any, res: any) {
  return handleChangePassword(req, res);
}
