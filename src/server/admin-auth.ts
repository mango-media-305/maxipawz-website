import {
    timingSafeEqual,
} from 'node:crypto';

export class AdminAuthError
    extends Error {
    readonly status: number;

    constructor(
        status: number,
        message: string,
    ) {
        super(
            message,
        );

        this.name =
            'AdminAuthError';

        this.status =
            status;
    }
}

export function assertAdminAuthorized(
    request: Request,
): void {
    const expectedToken =
        process.env
            .MAXIPAWZ_ADMIN_TOKEN
            ?.trim();

    if (
        !expectedToken ||
        expectedToken.length <
        32
    ) {
        throw new AdminAuthError(
            503,
            'The Maxi Pawz admin token is not configured.',
        );
    }

    const authorization =
        request.headers.get(
            'authorization',
        );

    if (
        !authorization
            ?.startsWith(
                'Bearer ',
            )
    ) {
        throw new AdminAuthError(
            401,
            'Administrator authentication is required.',
        );
    }

    const suppliedToken =
        authorization
            .slice(
                'Bearer '.length,
            )
            .trim();

    const expectedBuffer =
        Buffer.from(
            expectedToken,
        );

    const suppliedBuffer =
        Buffer.from(
            suppliedToken,
        );

    if (
        expectedBuffer.length !==
        suppliedBuffer.length ||
        !timingSafeEqual(
            expectedBuffer,
            suppliedBuffer,
        )
    ) {
        throw new AdminAuthError(
            401,
            'The administrator token is invalid.',
        );
    }
}