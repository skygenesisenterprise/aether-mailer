/**
 * One-off migration: encrypt certificate private keys at rest.
 *
 * The `certificate.privateKey` column moved from plaintext `text` to the
 * `encryptedText` custom type (AES-256-GCM). Legacy plaintext values are read
 * through transparently, but they stay plaintext in the database until they are
 * rewritten. This script re-encrypts every existing row in place.
 *
 * Usage:
 *   npx tsx apps/notploy/scripts/encrypt-certificate-keys.ts [--dry-run]
 *
 * Safe to run more than once: values already prefixed with `enc:v1:` are skipped.
 */
import { db } from "@notploy/server/db";
import { certificates } from "@notploy/server/db/schema";
import { isEncrypted } from "@notploy/server/lib/encryption";
import { eq } from "drizzle-orm";

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
	console.log("🔍 Fetching certificates...");
	const rows = await db
		.select({
			certificateId: certificates.certificateId,
			privateKey: certificates.privateKey,
		})
		.from(certificates);

	if (rows.length === 0) {
		console.log("✅ No certificates found, nothing to migrate.");
		return;
	}

	const pending = rows.filter(
		(row) => !isEncrypted(row.privateKey ?? ""),
	);

	console.log(
		`📦 Found ${rows.length} certificate(s), ${pending.length} still in plaintext.`,
	);

	if (pending.length === 0) {
		console.log("✅ All private keys are already encrypted.");
		return;
	}

	if (DRY_RUN) {
		console.log("🧪 Dry run: no changes written.");
		for (const row of pending) {
			console.log(`   would encrypt ${row.certificateId}`);
		}
		return;
	}

	let migrated = 0;
	const failed: string[] = [];

	for (const row of pending) {
		try {
			// Writing through the column applies `encryptValue` in toDriver.
			await db
				.update(certificates)
				.set({ privateKey: row.privateKey })
				.where(eq(certificates.certificateId, row.certificateId));
			migrated++;
		} catch (error) {
			console.error(
				`❌ Failed to migrate certificate ${row.certificateId}:`,
				error,
			);
			failed.push(row.certificateId);
		}
	}

	console.log(`✅ Encrypted ${migrated} private key(s).`);
	if (failed.length) {
		console.error(`❌ ${failed.length} failed: ${failed.join(", ")}`);
		process.exit(1);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	});
