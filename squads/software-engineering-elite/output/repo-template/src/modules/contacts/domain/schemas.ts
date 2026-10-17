import { z } from 'zod';

export const createContactSchema = z.object({
  firstName: z.string().min(1, 'O primeiro nome é obrigatório').max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email('Email inválido').max(255).optional(),
  phone: z.string().max(50).optional(),
  customFields: z.record(z.unknown()).optional().default({}),
});

export const updateContactSchema = createContactSchema.partial();
