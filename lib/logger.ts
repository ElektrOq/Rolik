import fs from 'fs';
import path from 'path';

export function logError(context: string, error: any) {
  try {
    const logFilePath = path.join(process.cwd(), 'app-errors.log');
    const timestamp = new Date().toISOString();
    const errorMessage = error?.message || String(error);
    const stack = error?.stack || '';
    
    const logEntry = `[${timestamp}] ERROR in ${context}:\n${errorMessage}\n${stack}\n----------------------------------------\n`;
    
    fs.appendFileSync(logFilePath, logEntry);
    console.error(logEntry);
  } catch (e) {
    console.error('Failed to write to log file', e);
  }
}
