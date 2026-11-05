import {describe,it,expect} from 'vitest';
import {copy,can,companySchema,money,demoAppointments} from '../src/domain';
describe('regional configuration',()=>{
 it('has identical dictionary keys',()=>expect(Object.keys(copy['pt-BR']).sort()).toEqual(Object.keys(copy['pt-PT']).sort()));
 it('uses regional vocabulary',()=>{expect(copy['pt-PT'].newBooking).toBe('Nova marcação');expect(copy['pt-BR'].newBooking).toBe('Novo agendamento');expect(copy['pt-PT'].password).toBe('Palavra-passe')});
 it('does not couple locale to currency',()=>{expect(money(12345,'pt-PT','BRL')).toContain('123');expect(money(12345,'pt-BR','EUR')).toContain('€')});
 it('validates allowed timezones and identifiers',()=>{const valid={name:'Demo',unit:'Centro',locale:'pt-PT',country:'PT',currency:'EUR',timezone:'Europe/Lisbon'};expect(companySchema.safeParse(valid).success).toBe(true);for(const field of ['name','unit','timezone','locale'])expect(companySchema.safeParse({...valid,[field]:''}).success).toBe(false)});
});
describe('permission matrix (UI only; enforcement is RLS)',()=>{
 it('restricts settings to owner',()=>{expect(can('owner','settings')).toBe(true);for(const r of ['manager','reception','professional'] as const)expect(can(r,'settings')).toBe(false)});
 it('restricts reports and reception writes',()=>{expect(can('manager','reports')).toBe(true);expect(can('reception','reports')).toBe(false);expect(can('professional','appointments')).toBe(false);expect(can('professional','ownSchedule')).toBe(true)});
 it('contains synthetic unique demo appointments',()=>expect(new Set(demoAppointments.map(x=>x.id)).size).toBe(demoAppointments.length));
});
