import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url,key) : null;
export type Membership = {tenant_id:string;role:'owner'|'manager'|'reception'|'professional';tenants:{id:string;name:string;locale:'pt-BR'|'pt-PT';currency:string;timezone:string;country:string}};
export async function loadMemberships():Promise<Membership[]> {
 if(!supabase) throw new Error('Integração não configurada');
 const {data,error}=await supabase.from('memberships').select('tenant_id,role,tenants(id,name,locale,currency,timezone,country)').eq('active',true);
 if(error) throw error;
 return (data??[]) as unknown as Membership[];
}
