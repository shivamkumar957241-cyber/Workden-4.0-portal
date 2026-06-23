import { base44 } from "@/api/base44Client";

const CHUNK_SIZE = 500; // 500 characters per chunk
const CHUNK_DELAY_MS = 300; // 300ms delay between chunks
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const LOCAL_STORAGE_KEY = 'draft_chunks_backup';

/**
 * Save entry with automatic chunking and rate limiting
 * Splits content into 500-char chunks, saves each with 300ms delay
 * Retries failed chunks up to 3 times, then saves to localStorage as backup
 */
export async function saveEntryWithChunking({ user, workType, entryData, content, startTime, taskId }) {
  const chunks = splitIntoChunks(content, CHUNK_SIZE);
  const results = {
    total_chunks: chunks.length,
    successful: 0,
    failed: 0,
    failed_chunks: [],
    success: true
  };

  // Save each chunk with delay
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkResult = await saveChunkWithRetry({
      user,
      workType,
      entryData,
      chunkContent: chunk,
      chunkNumber: i + 1,
      totalChunks: chunks.length,
      startTime,
      taskId
    });

    if (chunkResult.success) {
      results.successful++;
    } else {
      results.failed++;
      results.failed_chunks.push({ chunkNumber: i + 1, content: chunk, error: chunkResult.error });
      results.success = false;
    }

    // Add delay between chunks (except after last one)
    if (i < chunks.length - 1) {
      await delay(CHUNK_DELAY_MS);
    }
  }

  // Save failed chunks to localStorage as backup
  if (results.failed_chunks.length > 0) {
    saveFailedChunksToBackup(results.failed_chunks, workType, taskId);
  }

  return results;
}

/**
 * Split text into chunks of specified size
 */
function splitIntoChunks(text, chunkSize) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks.length > 0 ? chunks : [''];
}

/**
 * Save a single chunk with retry logic
 */
async function saveChunkWithRetry({ user, workType, entryData, chunkContent, chunkNumber, totalChunks, startTime, taskId }) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await base44.entities.DraftWork.create({
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_id_number: user.login_user_id || user.id,
        work_type: workType,
        task_content: chunkContent,
        task_data: {
          ...entryData,
          _chunk_number: chunkNumber,
          _total_chunks: totalChunks,
          _is_chunk: true
        },
        saved_date: new Date().toISOString(),
        start_time: new Date(startTime || Date.now()).toISOString(),
      });

      return { success: true };
    } catch (error) {
      lastError = error;
      console.warn(`Chunk ${chunkNumber} save failed (attempt ${attempt}/${MAX_RETRIES}):`, error.message);

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  return { success: false, error: lastError?.message || 'Unknown error' };
}

/**
 * Save failed chunks to localStorage as backup
 */
function saveFailedChunksToBackup(failedChunks, workType, taskId) {
  try {
    const backupKey = `${LOCAL_STORAGE_KEY}_${workType}_${taskId}`;
    const existing = localStorage.getItem(backupKey);
    const existingData = existing ? JSON.parse(existing) : [];

    const newBackup = [...existingData, ...failedChunks.map(fc => ({
      ...fc,
      backup_date: new Date().toISOString(),
      work_type: workType,
      task_id: taskId
    }))];

    localStorage.setItem(backupKey, JSON.stringify(newBackup));
    console.log(`💾 Saved ${failedChunks.length} chunks to localStorage backup`);
  } catch (e) {
    console.error('Failed to save backup to localStorage:', e);
  }
}

/**
 * Get failed chunks from localStorage backup
 */
export function getBackupChunks(workType, taskId) {
  try {
    const backupKey = `${LOCAL_STORAGE_KEY}_${workType}_${taskId}`;
    const existing = localStorage.getItem(backupKey);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Clear backup chunks after successful submission
 */
export function clearBackupChunks(workType, taskId) {
  try {
    const backupKey = `${LOCAL_STORAGE_KEY}_${workType}_${taskId}`;
    localStorage.removeItem(backupKey);
  } catch (e) {
    console.error('Failed to clear backup:', e);
  }
}

/**
 * Retry saving backup chunks from localStorage
 */
export async function retryBackupChunks(user, workType, taskId) {
  const backups = getBackupChunks(workType, taskId);
  if (backups.length === 0) return { retried: 0, successful: 0 };

  let successful = 0;
  for (const backup of backups) {
    try {
      await base44.entities.DraftWork.create({
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_id_number: user.login_user_id || user.id,
        work_type: backup.work_type || workType,
        task_content: backup.content,
        task_data: {
          _chunk_number: backup.chunkNumber,
          _total_chunks: backup.totalChunks,
          _is_chunk: true,
          _retried_from_backup: true
        },
        saved_date: new Date().toISOString(),
        start_time: new Date().toISOString(),
      });
      successful++;
    } catch (e) {
      console.warn('Backup retry failed:', e);
    }
    await delay(CHUNK_DELAY_MS);
  }

  if (successful > 0) {
    // Remove successfully retried chunks from backup
    const remaining = backups.filter((_, i) => i >= successful);
    if (remaining.length > 0) {
      const backupKey = `${LOCAL_STORAGE_KEY}_${workType}_${taskId}`;
      localStorage.setItem(backupKey, JSON.stringify(remaining));
    } else {
      clearBackupChunks(workType, taskId);
    }
  }

  return { retried: backups.length, successful };
}

/**
 * Simple delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch all drafts for a user and work type, reassembling chunks
 */
export async function fetchReassembledDrafts(userId, workType) {
  try {
    const drafts = await base44.entities.DraftWork.filter({ user_id: userId, work_type: workType });

    // Separate chunked and non-chunked drafts
    const chunkedDrafts = [];
    const regularDrafts = [];

    drafts.forEach(draft => {
      const taskData = typeof draft.task_data === 'string' 
        ? JSON.parse(draft.task_data) 
        : draft.task_data;

      if (taskData?._is_chunk) {
        chunkedDrafts.push({ ...draft, task_data: taskData });
      } else {
        regularDrafts.push(draft);
      }
    });

    // Group chunks by entry ID
    const chunksByEntry = {};
    chunkedDrafts.forEach(chunk => {
      const entryId = chunk.task_data?.id;
      if (!entryId) return;

      if (!chunksByEntry[entryId]) {
        chunksByEntry[entryId] = [];
      }
      chunksByEntry[entryId].push(chunk);
    });

    // Reassemble entries from chunks
    const reassembledEntries = [];
    Object.entries(chunksByEntry).forEach(([entryId, chunks]) => {
      // Sort chunks by chunk number
      chunks.sort((a, b) => (a.task_data?._chunk_number || 0) - (b.task_data?._chunk_number || 0));

      // Combine chunk contents
      const fullContent = chunks.map(c => c.task_content).join('');

      // Get original entry data from first chunk
      const firstChunk = chunks[0];
      const entryData = { ...firstChunk.task_data };
      delete entryData._chunk_number;
      delete entryData._total_chunks;
      delete entryData._is_chunk;

      reassembledEntries.push({
        id: entryId,
        task_content: fullContent,
        task_data: entryData,
        saved_date: firstChunk.saved_date,
        chunks_count: chunks.length
      });
    });

    return {
      regular: regularDrafts,
      reassembled: reassembledEntries,
      total: regularDrafts.length + reassembledEntries.length
    };
  } catch (e) {
    console.error('Failed to fetch reassembled drafts:', e);
    return { regular: [], reassembled: [], total: 0 };
  }
}