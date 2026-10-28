// Return safe, consistent JSON errors; never send database details or stack traces.
export function errorHandler(error, req, res, next) {
  if (error.name === "ZodError")
    return res
      .status(400)
      .json({
        message: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
  if (error.code === 11000)
    return res
      .status(409)
      .json({
        message:
          "That email or checkout reference already exists. Refresh and try again.",
      });
  if (["CastError", "ValidationError"].includes(error.name))
    return res.status(400).json({ message: "Invalid data." });
  const status = error.status || 500;
  if (status >= 500) console.error(error.message);
  res
    .status(status)
    .json({
      message:
        status >= 500 ? "Server error. Please try again." : error.message,
    });
}
