import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineBill } from '../types';

const QUEUE_KEY = 'offline_bills_queue';

export async function addToQueue(bill: OfflineBill): Promise<void> {
  try {
    const queue = await getQueue();
    queue.push(bill);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to queue:', error);
  }
}

export async function getQueue(): Promise<OfflineBill[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const filtered = queue.filter((b) => b.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from queue:', error);
  }
}

export async function updateQueueItem(id: string, updates: Partial<OfflineBill>): Promise<void> {
  try {
    const queue = await getQueue();
    const updated = queue.map((b) => (b.id === id ? { ...b, ...updates } : b));
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating queue item:', error);
  }
}

export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing queue:', error);
  }
}
