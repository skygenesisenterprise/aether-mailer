import type { BackupSchedule } from "@notploy/server/services/backup";
import {
	createDeploymentBackup,
	updateDeploymentStatus,
} from "@notploy/server/services/deployment";
import { findDestinationById } from "@notploy/server/services/destination";
import { findEnvironmentById } from "@notploy/server/services/environment";
import type { Mariadb } from "@notploy/server/services/mariadb";
import { findProjectById } from "@notploy/server/services/project";
import { sendDatabaseBackupNotifications } from "../notifications/database-backup";
import { execAsync, execAsyncRemote } from "../process/execAsync";
import {
	getBackupCommand,
	getBackupTimestamp,
	getS3Credentials,
	normalizeS3Path,
} from "./utils";

export const runMariadbBackup = async (
	mariadb: Mariadb,
	backup: BackupSchedule,
) => {
	const { environmentId, name, appName } = mariadb;
	const environment = await findEnvironmentById(environmentId);
	const project = await findProjectById(environment.projectId);
	const { prefix } = backup;
	const destination = await findDestinationById(backup.destinationId);
	const backupFileName = `${getBackupTimestamp()}.sql.gz`;
	const bucketDestination = `${appName}/${normalizeS3Path(prefix)}${backupFileName}`;
	const deployment = await createDeploymentBackup({
		backupId: backup.backupId,
		title: "MariaDB Backup",
		description: "MariaDB Backup",
	});
	try {
		const rcloneFlags = getS3Credentials(destination);
		const rcloneDestination = `:s3:${destination.bucket}/${bucketDestination}`;
		const backupCommand = getBackupCommand(
			backup,
			rcloneFlags,
			rcloneDestination,
			deployment.logPath,
		);
		if (mariadb.serverId) {
			await execAsyncRemote(mariadb.serverId, backupCommand);
		} else {
			await execAsync(backupCommand, {
				shell: "/bin/bash",
			});
		}

		await sendDatabaseBackupNotifications({
			applicationName: name,
			projectName: project.name,
			databaseType: "mariadb",
			type: "success",
			organizationId: project.organizationId,
			databaseName: backup.database,
		});
		await updateDeploymentStatus(deployment.deploymentId, "done");
	} catch (error) {
		console.log(error);
		await sendDatabaseBackupNotifications({
			applicationName: name,
			projectName: project.name,
			databaseType: "mariadb",
			type: "error",
			// @ts-ignore
			errorMessage: error?.message || "Error message not provided",
			organizationId: project.organizationId,
			databaseName: backup.database,
		});
		await updateDeploymentStatus(deployment.deploymentId, "error");
		throw error;
	}
};
