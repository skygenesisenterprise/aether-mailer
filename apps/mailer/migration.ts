import { dbUrl } from "@notploy/server/db";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// `onnotice: () => {}` keeps postgres.js from printing routine NOTICEs
// ("schema already exists, skipping", …) that only add noise to startup logs.
const sql = postgres(dbUrl, { max: 1, onnotice: () => {} });
const db = drizzle(sql);

await migrate(db, { migrationsFolder: "drizzle" })
	.then(() => {
		console.log("Migration complete");
	})
	.catch((error) => {
		console.error("Migration failed", error);
		// A non-zero exit aborts entrypoint.sh (`set -e`): starting the server
		// on a half-migrated database only produces a stream of query errors.
		process.exitCode = 1;
	})
	.finally(() => {
		sql.end();
	});
