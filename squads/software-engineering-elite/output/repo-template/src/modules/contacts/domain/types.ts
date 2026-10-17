export interface Contact {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactDTO {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  customFields?: Record<string, unknown>;
}

export interface UpdateContactDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  customFields?: Record<string, unknown>;
}
