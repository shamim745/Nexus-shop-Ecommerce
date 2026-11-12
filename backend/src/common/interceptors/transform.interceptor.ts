import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

interface DecimalLike {
  s: number;
  e: number;
  d: number[];
  toNumber(): number;
}

function isDecimal(value: object): value is DecimalLike {
  // Duck-typed: survives Prisma/CJS-vs-ESM dual-package class identity issues.
  return (
    "s" in value &&
    "e" in value &&
    "d" in value &&
    typeof (value as DecimalLike).toNumber === "function"
  );
}

/** Recursively converts Prisma Decimal values to plain numbers for JSON. */
function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value !== null && typeof value === "object") {
    if (isDecimal(value)) return value.toNumber();
    const source = value as Record<string, unknown>;
    const target: Record<string, unknown> = {};
    for (const key of Object.keys(source)) target[key] = serialize(source[key]);
    return target;
  }
  return value;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => ({ data: serialize(data) })));
  }
}
