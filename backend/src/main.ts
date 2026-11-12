import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { AppModule } from "./app.module.js";
import { resolveUploadDir } from "./uploads/uploads.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 3000);

  // Trusted browser origins: the configured CORS_ORIGIN value(s), plus any
  // localhost/127.0.0.1 origin (dev convenience — harmless for CSRF because a
  // hostile page can never send Origin: http://localhost:*).
  const allowedOrigins = new Set(
    config
      .get<string>("CORS_ORIGIN", "http://localhost:5173")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  const isTrustedOrigin = (value: string): boolean => {
    if (allowedOrigins.has(value)) return true;
    try {
      const url = new URL(value);
      return (
        localHosts.has(url.hostname) &&
        (url.protocol === "http:" || url.protocol === "https:")
      );
    } catch {
      return false;
    }
  };

  app.setGlobalPrefix("api");

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (
        err: Error | null,
        origin?: string | boolean | RegExp | Array<string | RegExp>,
      ) => void,
    ) => {
      if (!requestOrigin || isTrustedOrigin(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Requested-With", "Accept"],
  });

  // Lightweight CSRF defense: reject cross-site state-changing requests.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const requestOrigin = req.headers.origin;
    if (requestOrigin && !isTrustedOrigin(requestOrigin)) {
      res.status(403).json({
        statusCode: 403,
        message: "Cross-origin request blocked",
        error: "Forbidden",
        path: req.url,
      });
      return;
    }
    next();
  });

  // Uploaded product images
  const uploadDir = resolveUploadDir();
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  app.use(
    "/uploads",
    (await import("express")).static(join(uploadDir), {
      maxAge: "7d",
      immutable: true,
      fallthrough: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableShutdownHooks();

  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`API ready on http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", err);
  process.exit(1);
});
