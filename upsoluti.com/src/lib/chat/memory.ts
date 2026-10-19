import type {ChatMessage,ChatProfile} from './types';

export function visitorMemory(messages:ChatMessage[],profile:ChatProfile):string[]{
 if(!profile.memoryEnabled)return [];
 const excerpts=messages.filter(m=>m.role==='user'&&!/(senha|password|api.?key|token|segredo|chave secreta)/i.test(m.text)).map(m=>m.text.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[email omitido]').replace(/\+?\d[\d ()-]{7,}\d/g,'[número omitido]').slice(0,400));
 return [...new Set([...(profile.memoryNotes||[]),...excerpts])].slice(-12);
}
export function conversationContext(messages:ChatMessage[],profile:ChatProfile){
 const earlier=messages.slice(0,-12).filter(m=>m.role==='user').slice(-8).map(m=>m.text.slice(0,400));
 const previous=profile.memoryEnabled?(profile.memoryNotes||[]).slice(-12):[];
 return {previousConversations:previous,earlierInThisConversation:earlier};
}
