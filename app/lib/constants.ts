export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
export const API_OPENSIGN_URL = process.env.NEXT_PUBLIC_OPENSIGN_API_URL || "http://94.249.71.89:9000/api/app";
export const OPENSIGN_APP_ID = process.env.NEXT_PUBLIC_OPENSIGN_APP_ID || "opensign";

// ✅ CORRECTED: Backend should be :9000/api/app for direct access
export const OPENSIGN_SERVER_URL = process.env.OPENSIGN_BASE_URL || "http://94.249.71.89:9000/api/app";
