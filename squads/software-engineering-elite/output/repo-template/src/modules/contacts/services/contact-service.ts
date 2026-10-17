import { TenantContext, assertPermission } from '@/modules/auth/rbac';
import { createTenantClient } from '@/lib/db';
import { CreateContactDTO, UpdateContactDTO, Contact } from '../domain/types';
import { createContactSchema, updateContactSchema } from '../domain/schemas';

export class ContactService {
  constructor(private context: TenantContext, private accessToken?: string) {}

  async list(limit = 50, offset = 0): Promise<Contact[]> {
    assertPermission(this.context, 'contacts:read');

    const supabase: any = createTenantClient(this.accessToken);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', this.context.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Falha ao obter contactos: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      customFields: (row.custom_fields as Record<string, unknown>) || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async create(dto: CreateContactDTO): Promise<Contact> {
    assertPermission(this.context, 'contacts:write');

    const validated = createContactSchema.parse(dto);
    const supabase: any = createTenantClient(this.accessToken);

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: this.context.organizationId,
        first_name: validated.firstName,
        last_name: validated.lastName || null,
        email: validated.email || null,
        phone: validated.phone || null,
        custom_fields: validated.customFields,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao criar contacto: ${error.message}`);
    }

    await supabase.from('audit_logs').insert({
      organization_id: this.context.organizationId,
      actor_id: this.context.userId,
      actor_type: 'human',
      action: 'create',
      entity: 'contacts',
      entity_id: data.id,
      new_data: data,
    });

    return {
      id: data.id,
      organizationId: data.organization_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      customFields: (data.custom_fields as Record<string, unknown>) || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async update(id: string, dto: UpdateContactDTO): Promise<Contact> {
    assertPermission(this.context, 'contacts:write');

    const validated = updateContactSchema.parse(dto);
    const supabase: any = createTenantClient(this.accessToken);

    const { data: oldData } = await supabase.from('contacts').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('contacts')
      .update({
        first_name: validated.firstName,
        last_name: validated.lastName,
        email: validated.email,
        phone: validated.phone,
        custom_fields: validated.customFields,
      })
      .eq('id', id)
      .eq('organization_id', this.context.organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar contacto: ${error.message}`);
    }

    await supabase.from('audit_logs').insert({
      organization_id: this.context.organizationId,
      actor_id: this.context.userId,
      actor_type: 'human',
      action: 'update',
      entity: 'contacts',
      entity_id: data.id,
      old_data: oldData,
      new_data: data,
    });

    return {
      id: data.id,
      organizationId: data.organization_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      customFields: (data.custom_fields as Record<string, unknown>) || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async delete(id: string): Promise<void> {
    assertPermission(this.context, 'contacts:delete');

    const supabase: any = createTenantClient(this.accessToken);
    const { data: oldData } = await supabase.from('contacts').select('*').eq('id', id).single();

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('organization_id', this.context.organizationId);

    if (error) {
      throw new Error(`Falha ao apagar contacto: ${error.message}`);
    }

    await supabase.from('audit_logs').insert({
      organization_id: this.context.organizationId,
      actor_id: this.context.userId,
      actor_type: 'human',
      action: 'delete',
      entity: 'contacts',
      entity_id: id,
      old_data: oldData,
    });
  }
}
