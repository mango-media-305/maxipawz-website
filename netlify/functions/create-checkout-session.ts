import type {
    Config,
} from '@netlify/functions';

export default async function handler(
    request: Request,
): Promise<Response> {
    if (
        request.method !==
        'POST'
    ) {
        return Response.json(
            {
                ok: false,

                message:
                    'This endpoint accepts POST requests only.',
            },
            {
                status:
                    405,
            },
        );
    }

    return Response.json(
        {
            ok: false,

            code:
                'checkout-disabled',

            message:
                'The legacy hosted Checkout endpoint has been retired. MaxiPawz now uses carrier-calculated Embedded Checkout.',
        },
        {
            status:
                410,

            headers: {
                'Cache-Control':
                    'no-store, max-age=0',
            },
        },
    );
}

export const config:
    Config = {
    path:
        '/api/create-checkout-session',
};