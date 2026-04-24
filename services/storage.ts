import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_DIR = `${FileSystem.documentDirectory}storage/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(STORAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
  }
}

export async function storageGet(key: string): Promise<string | null> {
  try {
    await ensureDir();
    const path = `${STORAGE_DIR}${key}.json`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    return null;
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  await ensureDir();
  const path = `${STORAGE_DIR}${key}.json`;
  await FileSystem.writeAsStringAsync(path, value, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function storageRemove(key: string): Promise<void> {
  try {
    const path = `${STORAGE_DIR}${key}.json`;
    await FileSystem.deleteAsync(path, { idempotent: true });
  } catch {
    // ignore
  }
}

export const fileSystemStorage = {
  getItem: storageGet,
  setItem: storageSet,
  removeItem: storageRemove,
};
