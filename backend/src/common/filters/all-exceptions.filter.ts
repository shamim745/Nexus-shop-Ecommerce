import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Something went wrong";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === "string") {
        message = exResponse;
      } else if (typeof exResponse === "object" && exResponse !== null) {
        const body = exResponse as Record<string, unknown>;
        if (typeof body.message === "string" || Array.isArray(body.message)) {
          message = body.message as string | string[];
        } else {
          message = exception.message;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} — ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
      path: request.url,
    });
  }
}
