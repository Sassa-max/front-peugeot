export type HostEnvironment = "local" | "preprod" | "prod";

interface ApiConfig {
  [key: string]: string;
}

// Configuration centralisée des URLs d'API par environnement
const API_URLS: Record<HostEnvironment, string> = {
  local: "http://localhost:8000",
  preprod: "https://shopper-gateway-dev.redpill.paris",
  prod: "https://shopper-gateway.redpill.paris",
};

/**
 * Résout l'URL de l'API basée sur l'environnement ou retourne l'URL personnalisée
 * @param hostEnv - Environnement cible ('local', 'preprod', 'prod')
 * @param customApiUrl - URL personnalisée (pour rétrocompatibilité)
 * @returns URL de l'API à utiliser
 */
export function resolveApiUrl(
  hostEnv?: HostEnvironment,
  customApiUrl?: string
): string {
  // Si une URL personnalisée est fournie, elle a la priorité (rétrocompatibilité)
  if (customApiUrl) {
    return customApiUrl;
  }

  // Si hostEnv est fourni, utiliser la configuration centralisée
  if (hostEnv && API_URLS[hostEnv]) {
    return API_URLS[hostEnv];
  }

  // Valeur par défaut si aucune configuration n'est fournie
  throw new Error(
    "Vous devez fournir soit hostEnv (local|preprod|prod) soit apiUrl"
  );
}

/**
 * Valide l'environnement fourni
 * @param hostEnv - Environnement à valider
 * @returns true si l'environnement est valide
 */
export function isValidHostEnvironment(
  hostEnv: any
): hostEnv is HostEnvironment {
  return (
    typeof hostEnv === "string" && ["local", "preprod", "prod"].includes(hostEnv)
  );
}
