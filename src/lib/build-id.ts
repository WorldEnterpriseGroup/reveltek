// Build cache-buster token. CI overwrites this file with the short commit
// SHA before `npm run build` (see .github/workflows/deploy.yml); local
// builds fall back to "dev".
export const BUILD_ID = "dev";
