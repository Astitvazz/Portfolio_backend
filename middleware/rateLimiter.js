import rateLimit from "express-rate-limit";

// Rate limiter for contact form submissions
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: "Too many contact requests from this IP, please try again after 15 minutes"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests that might be from bots
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: true,
});

// General API rate limiter (optional - for all routes)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for preventing spam/abuse
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 submissions per hour
  message: {
    error: "You have exceeded the maximum number of contact submissions. Please try again in an hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
});