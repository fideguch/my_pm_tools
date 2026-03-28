import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, '../..');

export function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

export function listDir(relativePath: string): string[] {
  const dir = path.join(ROOT, relativePath);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}
