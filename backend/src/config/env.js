import "dotenv/config";
// Fail early with clear instructions instead of starting with missing secrets.
export function checkEnvironment() {
  for (const key of ["MONGODB_URI", "JWT_SECRET"]) {
    if (!process.env[key]) throw new Error(`Set ${key} in backend/.env first.`);
  }
  if (
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.startsWith("replace_")
  ) {
    throw new Error(
      "JWT_SECRET must be your own random secret of at least 32 characters.",
    );
  }
}
