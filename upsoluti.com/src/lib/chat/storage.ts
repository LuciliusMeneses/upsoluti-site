import { randomBytes, randomUUID, createHash } from 'node:crypto';
import type { ChatConversation, ChatProfile, ChatReply } from './types';
import type { StoredLead } from './store';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export const retentionDays=()=>Math.min(90,Math.max(1,Number(process.env.CHAT_RETENTION_DAYS)||30));
const remote=()=>!!process.env.CHAT_STORE_URL;
async function call<T>(action:string,data:Record<string,unknown>):Promise<T>{
 const url=new URL(process.env.CHAT_STORE_URL!);
 if(url.protocol!=='https:'||url.username||url.password)throw Error('invalid_storage_url');
 const token=process.env.CHAT_LEAD_WEBHOOK_TOKEN||process.env.CONTACT_WEBHOOK_TOKEN;
 if(!token)throw Error('storage_not_configured');
 const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({action,data}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!res.ok)throw Error('storage_unavailable');const result=await res.json();if(!Object.hasOwn(result,'data'))throw Error('storage_invalid_reply');return result.data as T;
}
const local=()=>import('./store');
export async function getConversation(token?:string):Promise<ChatConversation|null>{if(!token||!/^[a-f0-9]{64}$/.test(token))return null;return remote()?call('get',{hash:hash(token)}):(await local()).getConversation(token);}
export async function createConversation(){if(!remote())return (await local()).createConversation();const token=randomBytes(32).toString('hex'),id=randomUUID();await call('create',{id,hash:hash(token),expiresAt:new Date(Date.now()+retentionDays()*86400000).toISOString()});const conversation=await getConversation(token);if(!conversation)throw Error('storage_unavailable');return {token,conversation};}
export async function setConversationProfile(sessionId:string,profile:ChatProfile){return remote()?call('profile',{sessionId,profile}):(await local()).setConversationProfile(sessionId,profile);}
export async function restartConversation(token:string,profile:ChatProfile){
 if(!remote())return (await local()).restartConversation(token,profile);
 const nextToken=randomBytes(32).toString('hex');await call('restart',{hash:hash(token),nextHash:hash(nextToken),id:randomUUID(),profile});
 const conversation=await getConversation(nextToken);if(!conversation)throw Error('storage_unavailable');return {token:nextToken,conversation};
}
export async function deleteConversation(id:string){return remote()?call('delete',{sessionId:id}):(await local()).deleteConversation(id);}
export async function acquireConversation(id:string):Promise<boolean>{return remote()?call('acquire',{sessionId:id}):(await local()).acquireConversation(id);}
export async function releaseConversation(id:string){return remote()?call('release',{sessionId:id}):(await local()).releaseConversation(id);}
export async function saveUserMessage(sessionId:string,requestId:string,text:string){return remote()?call('user',{sessionId,requestId,text}):(await local()).saveUserMessage(sessionId,requestId,text);}
export async function findReply(sessionId:string,requestId:string):Promise<ChatReply|null>{return remote()?call('findReply',{sessionId,requestId}):(await local()).findReply(sessionId,requestId);}
export async function requestText(sessionId:string,requestId:string):Promise<string|null>{return remote()?call('requestText',{sessionId,requestId}):(await local()).requestText(sessionId,requestId);}
export async function saveReply(sessionId:string,requestId:string,reply:ChatReply,profile:ChatProfile){return remote()?call('reply',{sessionId,requestId,reply,profile}):(await local()).saveReply(sessionId,requestId,reply,profile);}
export async function consumeRateLimit(key:string,limit:number,windowMs:number):Promise<boolean>{return remote()?call('rate',{key:hash(key),limit,windowMs}):(await local()).consumeRateLimit(key,limit,windowMs);}
export async function getStoredLead(sessionId:string):Promise<StoredLead|null>{return remote()?call('getLead',{sessionId}):(await local()).getStoredLead(sessionId);}
export async function saveLead(sessionId:string,payload:Record<string,unknown>,profile:ChatProfile):Promise<StoredLead>{return remote()?call('saveLead',{sessionId,id:randomUUID(),payload,profile}):(await local()).saveLead(sessionId,payload,profile);}
export async function markLeadSynced(id:string){return remote()?call('synced',{id}):(await local()).markLeadSynced(id);}
