import { createServerFn } from '@tanstack/react-start';
import * as fs from 'node:fs';
import * as path from 'node:path';

const STORAGE_DIR = 'C:\\SECOND BRAIN\\App The One Thing\\TÀI LIỆU LƯU TRỮ';

function ensureDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export type MapData = {
  id: string;
  name: string;
  updatedAt: number;
  data?: any; // The board data
};

export const getMaps = createServerFn({ method: 'GET' }).handler(async () => {
  ensureDir();
  const files = fs.readdirSync(STORAGE_DIR).filter(f => f.endsWith('.json'));
  const maps = files.map(filename => {
    try {
      const content = fs.readFileSync(path.join(STORAGE_DIR, filename), 'utf-8');
      const parsed = JSON.parse(content);
      return {
        id: parsed.id || filename.replace('.json', ''),
        name: parsed.name || 'Sơ đồ không tên',
        updatedAt: parsed.updatedAt || 0,
      } as MapData;
    } catch {
      return null;
    }
  }).filter(Boolean) as MapData[];
  
  return maps.sort((a, b) => b.updatedAt - a.updatedAt);
});

export const getMapData = createServerFn({ method: 'GET' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data: { id } }) => {
    ensureDir();
    const filePath = path.join(STORAGE_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error('Map not found');
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  });

export const createMap = createServerFn({ method: 'POST' })
  .validator((d: { name: string }) => d)
  .handler(async ({ data: { name } }) => {
    ensureDir();
    const id = `map-${Date.now()}`;
    const newMap = {
      id,
      name,
      updatedAt: Date.now(),
      data: { children: [] }
    };
    fs.writeFileSync(path.join(STORAGE_DIR, `${id}.json`), JSON.stringify(newMap, null, 2), 'utf-8');
    return newMap;
  });

export const saveMap = createServerFn({ method: 'POST' })
  .validator((d: { id: string; data: any }) => d)
  .handler(async ({ data: { id, data } }) => {
    ensureDir();
    const filePath = path.join(STORAGE_DIR, `${id}.json`);
    let mapInfo = { id, name: 'Sơ đồ không tên', updatedAt: Date.now() };
    if (fs.existsSync(filePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        mapInfo = { ...content, updatedAt: Date.now() };
      } catch {}
    }
    mapInfo = { ...mapInfo, data, updatedAt: Date.now() };
    fs.writeFileSync(filePath, JSON.stringify(mapInfo, null, 2), 'utf-8');
    return true;
  });

export const renameMap = createServerFn({ method: 'POST' })
  .validator((d: { id: string; name: string }) => d)
  .handler(async ({ data: { id, name } }) => {
    ensureDir();
    const filePath = path.join(STORAGE_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) throw new Error('Not found');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    content.name = name;
    content.updatedAt = Date.now();
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    return true;
  });

export const deleteMap = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data: { id } }) => {
    ensureDir();
    const filePath = path.join(STORAGE_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  });
