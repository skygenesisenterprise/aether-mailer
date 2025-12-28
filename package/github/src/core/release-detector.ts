import type { ReleaseType, ReleaseMetadata } from "../types/index.js";

const RELEASE_TYPE_KEYWORDS: Record<ReleaseType, string[]> = {
  general: [],
  mobile: ["mobile", "ios", "android", "app"],
  desktop: ["desktop", "windows", "macos", "linux", "electron"],
  cloud: ["cloud", "server", "api", "service"],
  sdk: ["sdk", "library", "package", "npm", "pip"],
};

export class ReleaseDetector {
  private static readonly MULTI_TARGET_PATTERN = /\+([a-z]+)/g;

  static detectReleaseType(
    tagName: string,
    releaseName: string,
  ): ReleaseMetadata {
    const tag = tagName.toLowerCase();
    const name = releaseName.toLowerCase();
    const combined = `${tag} ${name}`;

    // Detect multi-target releases first
    const multiTargets = this.extractMultiTargets(combined);

    // If no multi-targets, detect single target
    if (multiTargets.length === 0) {
      const singleTarget = this.detectSingleTarget(combined);
      return this.createMetadata(tagName, releaseName, singleTarget, [
        singleTarget,
      ]);
    }

    // Validate multi-target combination
    this.validateMultiTargets(multiTargets);

    return this.createMetadata(tagName, releaseName, "general", multiTargets);
  }

  private static extractMultiTargets(text: string): ReleaseType[] {
    const matches = text.match(this.MULTI_TARGET_PATTERN);
    if (!matches) return [];

    const targets: ReleaseType[] = [];
    for (const match of matches) {
      const target = match.slice(1) as ReleaseType; // Remove '+' prefix
      if (this.isValidReleaseType(target)) {
        targets.push(target);
      }
    }

    return [...new Set(targets)]; // Remove duplicates
  }

  private static detectSingleTarget(text: string): ReleaseType {
    for (const [type, keywords] of Object.entries(RELEASE_TYPE_KEYWORDS)) {
      if (keywords.length === 0) continue; // Skip 'general' as it's the fallback

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return type as ReleaseType;
        }
      }
    }

    return "general";
  }

  private static validateMultiTargets(targets: ReleaseType[]): void {
    if (targets.length > 4) {
      throw new Error(
        `Too many release targets: ${targets.join(", ")}. Maximum allowed is 4.`,
      );
    }

    const invalidTargets = targets.filter(
      (target) => !this.isValidReleaseType(target),
    );
    if (invalidTargets.length > 0) {
      throw new Error(`Invalid release targets: ${invalidTargets.join(", ")}`);
    }
  }

  private static isValidReleaseType(type: string): type is ReleaseType {
    return ["general", "mobile", "desktop", "cloud", "sdk"].includes(type);
  }

  private static createMetadata(
    tag: string,
    name: string,
    type: ReleaseType,
    targets: ReleaseType[],
  ): ReleaseMetadata {
    const version = this.extractVersion(tag);
    const prerelease = this.isPrerelease(tag);
    const draft = false; // This will be set by the webhook payload

    return {
      type,
      targets,
      version,
      tag,
      name,
      prerelease,
      draft,
    };
  }

  private static extractVersion(tag: string): string {
    // Remove 'v' prefix if present
    const cleanTag = tag.startsWith("v") ? tag.slice(1) : tag;

    // Extract semantic version
    const semverMatch = cleanTag.match(/^(\d+\.\d+\.\d+)/);
    return semverMatch ? semverMatch[1]! : cleanTag;
  }

  private static isPrerelease(tag: string): boolean {
    const cleanTag = tag.startsWith("v") ? tag.slice(1) : tag;

    // Check for prerelease identifiers
    const prereleasePattern = /-(alpha|beta|rc|pre|dev)/;
    return prereleasePattern.test(cleanTag);
  }

  static validateReleaseMetadata(metadata: ReleaseMetadata): void {
    if (!metadata.version) {
      throw new Error("Release version is required");
    }

    if (metadata.targets.length === 0) {
      throw new Error("At least one release target is required");
    }

    if (metadata.targets.includes("general") && metadata.targets.length > 1) {
      throw new Error("General releases cannot have additional targets");
    }
  }
}

// Validation functions
export function validateReleaseMetadata(data: unknown): ReleaseMetadata {
  const metadata = data as ReleaseMetadata;

  if (
    !metadata.type ||
    !["general", "mobile", "desktop", "cloud", "sdk"].includes(metadata.type)
  ) {
    throw new Error("Invalid release type");
  }

  if (!Array.isArray(metadata.targets) || metadata.targets.length === 0) {
    throw new Error("Release targets must be a non-empty array");
  }

  if (typeof metadata.version !== "string" || metadata.version.length === 0) {
    throw new Error("Release version is required");
  }

  if (typeof metadata.tag !== "string" || metadata.tag.length === 0) {
    throw new Error("Release tag is required");
  }

  if (typeof metadata.name !== "string" || metadata.name.length === 0) {
    throw new Error("Release name is required");
  }

  if (typeof metadata.prerelease !== "boolean") {
    throw new Error("Prerelease flag must be a boolean");
  }

  if (typeof metadata.draft !== "boolean") {
    throw new Error("Draft flag must be a boolean");
  }

  return metadata;
}

export function validateWebhookEvent(data: unknown): {
  id: string;
  name: string;
  payload: unknown;
} {
  const event = data as { id?: string; name?: string; payload?: unknown };

  if (!event.id || typeof event.id !== "string") {
    throw new Error("Webhook event ID is required");
  }

  if (!event.name || typeof event.name !== "string") {
    throw new Error("Webhook event name is required");
  }

  return {
    id: event.id,
    name: event.name,
    payload: event.payload,
  };
}
