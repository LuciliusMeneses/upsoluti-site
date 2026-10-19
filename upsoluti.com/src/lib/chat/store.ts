import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ChatConversation, ChatMessage, ChatProfile, ChatReply, LeadStatus } from './types';

let database: DatabaseSync | undefined;
let lastCleanup = 0;
export const retentionDays = () => Math.min(90, Math.max(1, Number(process.env.CHAT_RETENTION_DAYS) || 30));
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export function getDatabase() {
  if (!database) {
    const file = resolve(process.env.CHAT_STORAGE_PATH || '.data/chat.sqlite');
    mkdirSync(dirname(file), { recursive: true });
    database = new DatabaseSync(file);
    database.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;" +
      "CREATE TABLE IF NOT EXISTS chat_sessions (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, profile TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, busy_until INTEGER NOT NULL DEFAULT 0);" +
      "CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE, request_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, metadata TEXT, created_at INTEGER NOT NULL, UNIQUE(session_id,request_id,role));" +
      "CREATE INDEX IF NOT EXISTS chat_message_session ON chat_messages(session_id,created_at);" +
      "CREATE TABLE IF NOT EXISTS chat_leads (id TEXT PRIMARY KEY, session_id TEXT UNIQUE NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, synced_at INTEGER);" +
      "CREATE TABLE IF NOT EXISTS chat_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);"
    );
  }
  if (Date.now() - lastCleanup > 60000) {
    database.prepare('DELETE FROM chat_sessions WHERE expires_at < ?').run(Date.now());
    database.prepare('DELETE FROM chat_limits WHERE reset_at < ?').run(Date.now());
    lastCleanup = Date.now();
  }
  return database;
}

export function createConversation() {
  const token = randomBytes(32).toString('hex');
  const id = randomUUID();
  const now = Date.now();
  getDatabase().prepare('INSERT INTO chat_sessions (id,token_hash,created_at,expires_at) VALUES (?,?,?,?)').run(id, tokenHash(token), now, now + retentionDays() * 86400000);
  return { token, conversation: getConversation(token)! };
}

export function getConversation(token?: string): ChatConversation | null {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM chat_sessions WHERE token_hash=? AND expires_at>?').get(tokenHash(token), Date.now());
  if (!row) return null;
  const messages = db.prepare('SELECT * FROM chat_messages WHERE session_id=? ORDER BY created_at,rowid').all(String(row.id)).map(message => ({ id: String(message.request_id) + '-' + String(message.role), role: message.role, text: message.content, createdAt: new Date(Number(message.created_at)).toISOString(), serviceSlug: message.metadata ? (JSON.parse(String(message.metadata)) as ChatReply).serviceSlug : undefined })) as ChatMessage[];
  const lead = db.prepare('SELECT status FROM chat_leads WHERE session_id=?').get(String(row.id));
  return { id: String(row.id), messages, profile: JSON.parse(String(row.profile)), leadStatus: lead ? String(lead.status) as LeadStatus : null, expiresAt: new Date(Number(row.expires_at)).toISOString() };
}

export function setConversationProfile(id:string,profile:ChatProfile){getDatabase().prepare('UPDATE chat_sessions SET profile=? WHERE id=?').run(JSON.stringify(profile),id);}
export function restartConversation(token:string,profile:ChatProfile){
 const old=getConversation(token);if(!old)throw Error('unknown_session');
 const group=old.profile.memoryGroup||randomUUID();
 const db=getDatabase();db.exec('BEGIN IMMEDIATE');
 try{setConversationProfile(old.id,{...old.profile,memoryGroup:group});const created=createConversation();setConversationProfile(created.conversation.id,{...profile,memoryGroup:group});db.prepare('UPDATE chat_sessions SET expires_at=? WHERE id=?').run(Date.parse(old.expiresAt),created.conversation.id);db.exec('COMMIT');return {token:created.token,conversation:getConversation(created.token)!};}catch(e){db.exec('ROLLBACK');throw e;}
}
export function deleteConversation(id: string) {
 const db=getDatabase(),row=db.prepare('SELECT profile FROM chat_sessions WHERE id=?').get(id);
 const group=row?JSON.parse(String(row.profile)).memoryGroup:undefined;
 if(group)db.prepare("DELETE FROM chat_sessions WHERE json_extract(profile,'$.memoryGroup')=?").run(group);
 else db.prepare('DELETE FROM chat_sessions WHERE id=?').run(id);
}
export function acquireConversation(id: string) {
  return Number(getDatabase().prepare('UPDATE chat_sessions SET busy_until=? WHERE id=? AND busy_until<?').run(Date.now() + 90000, id, Date.now()).changes) === 1;
}
export function releaseConversation(id: string) { getDatabase().prepare('UPDATE chat_sessions SET busy_until=0 WHERE id=?').run(id); }
export function saveUserMessage(sessionId: string, requestId: string, text: string) {
  getDatabase().prepare('INSERT OR IGNORE INTO chat_messages (id,session_id,request_id,role,content,created_at) VALUES (?,?,?,?,?,?)').run(randomUUID(), sessionId, requestId, 'user', text, Date.now());
}
export function findReply(sessionId: string, requestId: string): ChatReply | null {
  const row = getDatabase().prepare("SELECT metadata FROM chat_messages WHERE session_id=? AND request_id=? AND role='assistant'").get(sessionId, requestId);
  return row?.metadata ? JSON.parse(String(row.metadata)) : null;
}
export function requestText(sessionId: string, requestId: string): string | null {
  const row = getDatabase().prepare("SELECT content FROM chat_messages WHERE session_id=? AND request_id=? AND role='user'").get(sessionId, requestId);
  return row ? String(row.content) : null;
}
export function saveReply(sessionId: string, requestId: string, reply: ChatReply, profile: ChatProfile) {
  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('INSERT OR IGNORE INTO chat_messages (id,session_id,request_id,role,content,metadata,created_at) VALUES (?,?,?,?,?,?,?)').run(randomUUID(), sessionId, requestId, 'assistant', reply.answer, JSON.stringify(reply), Date.now());
    db.prepare('UPDATE chat_sessions SET profile=? WHERE id=?').run(JSON.stringify(profile), sessionId);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function consumeRateLimit(key: string, limit: number, windowMs: number): boolean {
  const db = getDatabase();
  const hash = tokenHash(key);
  db.prepare('INSERT INTO chat_limits (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END, reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END').run(hash, Date.now() + windowMs, Date.now(), Date.now());
  const row = db.prepare('SELECT count FROM chat_limits WHERE key=?').get(hash);
  return Number(row?.count) <= limit;
}
export type StoredLead = { id: string; status: LeadStatus; payload: Record<string, unknown> };
export function getStoredLead(sessionId: string): StoredLead | null {
  const row = getDatabase().prepare('SELECT * FROM chat_leads WHERE session_id=?').get(sessionId);
  return row ? { id: String(row.id), status: String(row.status) as LeadStatus, payload: JSON.parse(String(row.payload)) } : null;
}
export function saveLead(sessionId: string, payload: Record<string, unknown>, profile: ChatProfile): StoredLead {
  const existing = getStoredLead(sessionId);
  if (existing) return existing;
  const id = randomUUID();
  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('INSERT INTO chat_leads (id,session_id,payload,created_at) VALUES (?,?,?,?)').run(id, sessionId, JSON.stringify(payload), Date.now());
    db.prepare('UPDATE chat_sessions SET profile=? WHERE id=?').run(JSON.stringify(profile), sessionId);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return { id, status: 'pending', payload };
}
export function markLeadSynced(id: string) { getDatabase().prepare("UPDATE chat_leads SET status='synced',synced_at=? WHERE id=?").run(Date.now(), id); }
