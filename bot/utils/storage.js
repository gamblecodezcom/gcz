import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.resolve(__dirname, '../storage');
const USERS_FILE = path.join(STORAGE_DIR, 'users.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Load users from storage
 */
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return {};
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    logger.error('Failed to load users:', err);
    return {};
  }
}

/**
 * Save users to storage
 */
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    logger.error('Failed to save users:', err);
  }
}

/**
 * Get or create user profile
 */
export function getUserProfile(telegramId) {
  const users = loadUsers();
  const userId = telegramId.toString();
  
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      username: null,
      first_name: null,
      last_name: null,
      has_started: false,
      cwalletId: null,
      runewager: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveUsers(users);
  }
  
  return users[userId];
}

/**
 * Update user profile from Telegram user object
 */
export function touchUser(telegramUser) {
  const users = loadUsers();
  const userId = telegramUser.id.toString();
  
  const user = getUserProfile(userId);
  user.username = telegramUser.username || null;
  user.first_name = telegramUser.first_name || null;
  user.last_name = telegramUser.last_name || null;
  user.updated_at = new Date().toISOString();
  
  users[userId] = user;
  saveUsers(users);
  
  return user;
}

/**
 * Mark user as started
 */
export function markUserStarted(telegramId) {
  const users = loadUsers();
  const userId = telegramId.toString();
  const user = getUserProfile(userId);
  
  user.has_started = true;
  user.updated_at = new Date().toISOString();
  
  users[userId] = user;
  saveUsers(users);
  
  return user;
}

/**
 * Set Cwallet ID
 */
export function setCwalletId(telegramId, cwalletId, telegramUser = null) {
  const users = loadUsers();
  const userId = telegramId.toString();
  const user = getUserProfile(userId);
  
  if (telegramUser) {
    touchUser(telegramUser);
  }
  
  user.cwalletId = cwalletId;
  user.updated_at = new Date().toISOString();
  
  users[userId] = user;
  saveUsers(users);
  
  return user;
}

/**
 * Set Runewager username
 */
export function setRunewagerUsername(telegramId, runewager, telegramUser = null) {
  const users = loadUsers();
  const userId = telegramId.toString();
  const user = getUserProfile(userId);
  
  if (telegramUser) {
    touchUser(telegramUser);
  }
  
  user.runewager = runewager;
  user.updated_at = new Date().toISOString();
  
  users[userId] = user;
  saveUsers(users);
  
  return user;
}

/**
 * Get all users (for admin purposes)
 */
export function getAllUsers() {
  return loadUsers();
}
