// Attach the HTTP status to errors handled by our central error middleware.
export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
