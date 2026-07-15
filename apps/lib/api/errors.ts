export type ApiErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "conflict"
  | "rate_limited"
  | "dependency_unavailable"
  | "internal_error"
  | "network_error";

export class ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  details?: unknown;
  kind: ApiErrorKind;

  constructor(options: {
    message: string;
    status: number;
    code?: string;
    requestId?: string;
    details?: unknown;
    kind?: ApiErrorKind;
    cause?: unknown;
  }) {
    super(options.message, options.cause ? { cause: options.cause } : undefined);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
    this.kind = options.kind ?? classifyApiError(options.status, options.code);
  }
}

export function classifyApiError(status: number, code?: string): ApiErrorKind {
  if (status === 0) return "network_error";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400 || code === "VALIDATION_FAILED") return "validation_error";
  if (status === 429) return "rate_limited";
  if (status === 502 || status === 503 || status === 504 || code === "DEPENDENCY_UNAVAILABLE") {
    return "dependency_unavailable";
  }
  return "internal_error";
}

export function getUserFacingError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case "unauthenticated":
        return "Votre session a expiré. Reconnectez-vous pour continuer.";
      case "forbidden":
        return "Vous n’avez pas les autorisations nécessaires pour cette action.";
      case "not_found":
        return "La ressource demandée est introuvable.";
      case "validation_error":
        return "Certaines informations envoyées sont invalides.";
      case "conflict":
        return "Cette action est en conflit avec l’état actuel des données.";
      case "rate_limited":
        return "Trop de requêtes ont été envoyées. Réessayez dans un instant.";
      case "dependency_unavailable":
        return "Le service demandé est temporairement indisponible.";
      case "network_error":
        return "La connexion au serveur a échoué.";
      default:
        return "Une erreur interne est survenue.";
    }
  }

  return "Une erreur inattendue est survenue.";
}
