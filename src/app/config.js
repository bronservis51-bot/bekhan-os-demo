import { validateBackendConfig } from "../integrations/bron-leads/config.js";
export const backendConfig = validateBackendConfig({
  url: "https://api.bronservis.ru",
  publishableKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzk0NTEyNzU2LCJleHAiOjE5NTIxOTI3NTZ9.XeI7BiAbctQjSrwNJTXOcACb7C7pJ1lMfFWVrs898NU",
});
export const RELEASE = "0.2.0";
