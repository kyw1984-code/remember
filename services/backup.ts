import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from './db';

interface BackupData {
  version: number;
  created_at: string;
  card_sets: Array<{
    id: number;
    name: string;
    description: string;
    preset_type: string | null;
    cards: Array<{ front: string; back: string }>;
  }>;
}

export async function exportData(): Promise<void> {
  const database = await getDatabase();

  const sets = await database.getAllAsync<{
    id: number;
    name: string;
    description: string;
    preset_type: string | null;
  }>('SELECT id, name, description, preset_type FROM card_sets ORDER BY id');

  const backup: BackupData = {
    version: 1,
    created_at: new Date().toISOString(),
    card_sets: [],
  };

  for (const set of sets) {
    const cards = await database.getAllAsync<{ front: string; back: string }>(
      'SELECT front, back FROM cards WHERE set_id = ? ORDER BY id',
      [set.id]
    );
    backup.card_sets.push({ ...set, cards });
  }

  const json = JSON.stringify(backup, null, 2);
  const fileUri = `${FileSystem.documentDirectory}remember_backup_${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: '백업 파일 공유' });
  }
}

export async function importData(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return { success: false, message: '취소됨' };

    const asset = result.assets[0];
    const content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
    const backup: BackupData = JSON.parse(content);

    if (!backup.card_sets || !Array.isArray(backup.card_sets)) {
      return { success: false, message: '올바른 백업 파일이 아닙니다' };
    }

    const database = await getDatabase();
    let importedSets = 0;
    let importedCards = 0;

    await database.withTransactionAsync(async () => {
      for (const set of backup.card_sets) {
        const setResult = await database.runAsync(
          'INSERT INTO card_sets (name, description, preset_type) VALUES (?, ?, ?)',
          [set.name, set.description || '', set.preset_type ?? null]
        );
        const setId = setResult.lastInsertRowId;
        importedSets++;

        for (const card of set.cards) {
          const cardResult = await database.runAsync(
            'INSERT INTO cards (set_id, front, back) VALUES (?, ?, ?)',
            [setId, card.front, card.back]
          );
          await database.runAsync(
            'INSERT OR IGNORE INTO sr_schedule (card_id) VALUES (?)',
            [cardResult.lastInsertRowId]
          );
          importedCards++;
        }
      }
    });

    return { success: true, message: `${importedSets}개 세트, ${importedCards}개 카드를 가져왔습니다` };
  } catch (e) {
    return { success: false, message: '파일을 읽는 중 오류가 발생했습니다' };
  }
}
