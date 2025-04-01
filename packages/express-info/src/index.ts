import { type RequestHandler } from 'express';

export default function createInfoHandler(
  data: Record<string, string | number | bigint | boolean | null | undefined>,
): RequestHandler {
  return (req, res) => void res.json(data);
}
