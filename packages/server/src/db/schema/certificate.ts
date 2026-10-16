import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { organization } from "./account";
import { server } from "./server";
import { encryptedText, generateAppName } from "./utils";

export const certificates = pgTable("certificate", {
	certificateId: text("certificateId")
		.notNull()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	// Public certificate material, safe to serve to clients.
	certificateData: text("certificateData").notNull(),
	// Secret material: encrypted at rest with AES-256-GCM and never returned
	// by the API.
	privateKey: encryptedText("privateKey").notNull(),
	certificatePath: text("certificatePath")
		.notNull()
		.$defaultFn(() => generateAppName("certificate"))
		.unique(),
	autoRenew: boolean("autoRenew"),
	organizationId: text("organizationId")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	serverId: text("serverId").references(() => server.serverId, {
		onDelete: "cascade",
	}),
	notBefore: timestamp("notBefore", { withTimezone: true }),
	notAfter: timestamp("notAfter", { withTimezone: true }),
	issuer: text("issuer"),
	commonName: text("commonName"),
	subjectAltNames: text("subjectAltNames").array().default([]),
	createdAt: timestamp("createdAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const certificatesRelations = relations(certificates, ({ one }) => ({
	server: one(server, {
		fields: [certificates.serverId],
		references: [server.serverId],
	}),
	organization: one(organization, {
		fields: [certificates.organizationId],
		references: [organization.id],
	}),
}));

export const apiCreateCertificate = createInsertSchema(certificates, {
	name: z.string().min(1),
	certificateData: z.string().min(1),
	privateKey: z.string().min(1),
	autoRenew: z.boolean().optional(),
	serverId: z.string().optional(),
}).omit({
	notBefore: true,
	notAfter: true,
	issuer: true,
	commonName: true,
	subjectAltNames: true,
	createdAt: true,
	updatedAt: true,
	organizationId: true,
});

export const apiFindCertificate = z.object({
	certificateId: z.string().min(1),
});

export const apiUpdateCertificate = z.object({
	certificateId: z.string().min(1),
	name: z.string().min(1).optional(),
	certificateData: z.string().min(1).optional(),
	privateKey: z.string().min(1).optional(),
});

export const apiDeleteCertificate = z.object({
	certificateId: z.string().min(1),
});
