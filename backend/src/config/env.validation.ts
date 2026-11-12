import Joi from "joi";

export interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_TTL: string;
  COOKIE_SECURE: boolean;
  COOKIE_SAME_SITE: "lax" | "strict" | "none";
  CORS_ORIGIN: string;
  UPLOAD_DIR: string;
  MAX_UPLOAD_MB: number;
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  SEED_ADMIN_EMAIL: string;
  SEED_ADMIN_PASSWORD: string;
}

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ["postgresql", "postgres"] })
    .required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default("15m"),
  JWT_REFRESH_TTL: Joi.string().default("7d"),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAME_SITE: Joi.string()
    .valid("lax", "strict", "none")
    .default("lax"),
  CORS_ORIGIN: Joi.string().uri().default("http://localhost:5173"),
  UPLOAD_DIR: Joi.string().default("./uploads"),
  MAX_UPLOAD_MB: Joi.number().min(1).max(50).default(5),
  SMTP_HOST: Joi.string().allow("").optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow("").optional(),
  SMTP_PASS: Joi.string().allow("").optional(),
  SMTP_FROM: Joi.string().allow("").optional(),
  SEED_ADMIN_EMAIL: Joi.string().email().default("admin@shop.com"),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).default("Admin@12345"),
}).unknown(true);

export function validateEnv(
  config: Record<string, unknown>,
): EnvConfig {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
    convert: true,
  });
  if (error) {
    throw new Error(
      `Invalid environment variables:\n${error.details
        .map((d) => `  ${d.path.join(".")}: ${d.message}`)
        .join("\n")}`,
    );
  }
  return value as EnvConfig;
}
