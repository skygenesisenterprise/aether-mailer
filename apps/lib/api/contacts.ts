import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { Contact, ContactGroup } from "@/lib/api/types";

export interface ContactInput extends Record<string, unknown> {}
export interface ContactGroupInput extends Record<string, unknown> {}

export async function listContacts(workspaceId: string): Promise<Contact[]> {
  const response = await apiListRequest<Contact>(`/workspaces/${workspaceId}/contacts`);
  return response.data;
}

export function createContact(workspaceId: string, input: ContactInput): Promise<Contact> {
  return apiRequest<Contact, ContactInput>(`/workspaces/${workspaceId}/contacts`, {
    method: "POST",
    body: input,
  });
}

export function getContact(contactId: string): Promise<Contact> {
  return apiRequest<Contact>(`/contacts/${contactId}`);
}

export function updateContact(contactId: string, input: ContactInput): Promise<Contact> {
  return apiRequest<Contact, ContactInput>(`/contacts/${contactId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteContact(contactId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/contacts/${contactId}`, {
    method: "DELETE",
  });
}

export async function listContactGroups(workspaceId: string): Promise<ContactGroup[]> {
  const response = await apiListRequest<ContactGroup>(`/workspaces/${workspaceId}/contact-groups`);
  return response.data;
}

export function createContactGroup(workspaceId: string, input: ContactGroupInput): Promise<ContactGroup> {
  return apiRequest<ContactGroup, ContactGroupInput>(`/workspaces/${workspaceId}/contact-groups`, {
    method: "POST",
    body: input,
  });
}

export function getContactGroup(groupId: string): Promise<ContactGroup> {
  return apiRequest<ContactGroup>(`/contact-groups/${groupId}`);
}

export function updateContactGroup(groupId: string, input: ContactGroupInput): Promise<ContactGroup> {
  return apiRequest<ContactGroup, ContactGroupInput>(`/contact-groups/${groupId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteContactGroup(groupId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/contact-groups/${groupId}`, {
    method: "DELETE",
  });
}
