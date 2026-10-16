import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const npmjsRegistry = "https://registry.npmjs.org/";
const packages = [
  { name: "@notploy/cli", directory: "packages/cli" },
  { name: "@notploy/sdk", directory: "packages/sdk" },
  { name: "@notploy/trpc-openapi", directory: "packages/trpc-openapi" },
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function requireSuccess(result, description) {
  if (result.status !== 0) {
    throw new Error(`${description} failed with exit code ${result.status}`);
  }
}

function releaseTag(version) {
  const prerelease = version.split("-")[1];
  return prerelease ? prerelease.split(".")[0] : "latest";
}

function isNotFound(output) {
  return /E404|404 Not Found|Not Found - GET/i.test(output);
}

function registryHasVersion(name, version, registry, npmConfig) {
  const result = run(
    "npm",
    ["view", `${name}@${version}`, "version", "--registry", registry],
    {
      env: {
        ...process.env,
        NPM_CONFIG_USERCONFIG: npmConfig,
      },
    },
  );

  if (result.status === 0) {
    return true;
  }

  const output = `${result.stdout}\n${result.stderr}`;
  if (isNotFound(output)) {
    return false;
  }

  throw new Error(
    `Could not check ${name}@${version} on ${registry}: ${output.trim()}`,
  );
}

function publish(tarball, tag, npmConfig) {
  const args = [
    "publish",
    tarball,
    "--registry",
    npmjsRegistry,
    "--tag",
    tag,
    "--access",
    "public",
  ];

  const result = run("npm", args, {
    env: {
      ...process.env,
      NPM_CONFIG_USERCONFIG: npmConfig,
    },
    stdio: "inherit",
  });
  requireSuccess(result, `Publishing ${path.basename(tarball)} to npmjs`);
}

async function readPackage(directory, expectedName) {
  const packagePath = path.join(repositoryRoot, directory, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));

  if (packageJson.name !== expectedName) {
    throw new Error(
      `Expected ${expectedName} in ${directory}/package.json, found ${packageJson.name}`,
    );
  }

  if (!packageJson.version) {
    throw new Error(`Missing package version in ${directory}/package.json`);
  }

  return packageJson;
}

async function packPackage(pkg, packageJson, tempDirectory) {
  const packageDirectory = path.join(tempDirectory, pkg.name.replace("/", "-"));
  const mkdirResult = run("mkdir", ["-p", packageDirectory]);
  requireSuccess(mkdirResult, `Creating pack directory for ${pkg.name}`);

  const packResult = run(
    "pnpm",
    [
      "--filter",
      pkg.name,
      "pack",
      "--pack-destination",
      packageDirectory,
    ],
    { stdio: "inherit" },
  );
  requireSuccess(packResult, `Packing ${pkg.name}@${packageJson.version}`);

  const tarballs = (await readdir(packageDirectory)).filter((file) =>
    file.endsWith(".tgz"),
  );
  if (tarballs.length !== 1) {
    throw new Error(
      `Expected one tarball for ${pkg.name}@${packageJson.version}, found ${tarballs.length}`,
    );
  }

  return path.join(packageDirectory, tarballs[0]);
}

async function verifyTarball(tarball, expectedName, expectedVersion) {
  const result = run("tar", ["-xOf", tarball, "package/package.json"]);
  requireSuccess(result, `Inspecting ${path.basename(tarball)}`);
  const metadata = JSON.parse(result.stdout);

  if (metadata.name !== expectedName || metadata.version !== expectedVersion) {
    throw new Error(
      `Tarball metadata mismatch: expected ${expectedName}@${expectedVersion}, found ${metadata.name}@${metadata.version}`,
    );
  }
}

async function main() {
  if (!process.env.NPM_TOKEN) {
    throw new Error("NPM_TOKEN is required to publish to npmjs");
  }

  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "notploy-node-release-"),
  );
  const npmConfig = path.join(tempDirectory, "npmrc");
  const completedPackages = [];

  try {
    await writeFile(
      npmConfig,
      [
        "registry=https://registry.npmjs.org/",
        "//registry.npmjs.org/:_authToken=${NPM_TOKEN}",
        "",
      ].join("\n"),
      { mode: 0o600 },
    );

    for (const pkg of packages) {
      const packageJson = await readPackage(pkg.directory, pkg.name);
      const version = packageJson.version;
      const onNpmjs = registryHasVersion(
        pkg.name,
        version,
        npmjsRegistry,
        npmConfig,
      );

      if (onNpmjs) {
        console.log(`${pkg.name}@${version} already exists on npmjs`);
        continue;
      }

      const buildResult = run(
        "pnpm",
        ["--filter", pkg.name, "run", "build"],
        { stdio: "inherit" },
      );
      requireSuccess(buildResult, `Building ${pkg.name}@${version}`);

      const tarball = await packPackage(pkg, packageJson, tempDirectory);
      await verifyTarball(tarball, pkg.name, version);
      const digest = createHash("sha256")
        .update(await readFile(tarball))
        .digest("hex");
      console.log(
        `Publishing ${pkg.name}@${version} from ${path.basename(tarball)} (sha256 ${digest})`,
      );

      const tag = releaseTag(version);
      try {
        publish(tarball, tag, npmConfig);
      } catch (error) {
        if (!registryHasVersion(pkg.name, version, npmjsRegistry, npmConfig)) {
          throw error;
        }
        console.log(
          `${pkg.name}@${version} was published concurrently; treating it as already present`,
        );
      }

      completedPackages.push(`${pkg.name}@${version}`);
    }

    for (const packageVersion of completedPackages) {
      console.log(`New tag: ${packageVersion}`);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
