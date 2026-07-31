export interface EasyPostAddress {
    name: string;

    street1: string;

    street2?: string;

    city: string;

    state: string;

    zip: string;

    country: 'US';
}

export interface EasyPostParcel {
    length: number;

    width: number;

    height: number;

    weight: number;
}

export interface EasyPostRate {
    id: string;

    carrier: string;

    service: string;

    rate: string;

    currency: string;

    delivery_days?: number | null;

    est_delivery_days?: number | null;

    shipment_id: string;
}

export interface EasyPostShipment {
    id: string;

    mode:
    | 'test'
    | 'production';

    rates:
    EasyPostRate[];
}

interface EasyPostRuntimeConfig {
    apiKey: string;

    fromAddress:
    EasyPostAddress;

    testParcel:
    EasyPostParcel;
}

const EASYPOST_API_ORIGIN =
    'https://api.easypost.com/v2';

function requiredEnvironmentVariable(
    name: string,
): string {
    const value =
        process.env[
            name
        ]?.trim();

    if (
        !value
    ) {
        throw new Error(
            `${name} is not configured.`,
        );
    }

    return value;
}

function optionalEnvironmentVariable(
    name: string,
): string | undefined {
    const value =
        process.env[
            name
        ]?.trim();

    return value ||
        undefined;
}

function positiveNumberEnvironmentVariable(
    name: string,
): number {
    const value =
        Number(
            requiredEnvironmentVariable(
                name,
            ),
        );

    if (
        !Number.isFinite(
            value,
        ) ||
        value <= 0
    ) {
        throw new Error(
            `${name} must be a positive number.`,
        );
    }

    return value;
}

function getRuntimeConfig():
    EasyPostRuntimeConfig {
    if (
        process.env
            .EASYPOST_MODE !==
        'test'
    ) {
        throw new Error(
            'EasyPost must use test mode while MaxiPawz Checkout is in Stripe Sandbox.',
        );
    }

    return {
        apiKey:
            requiredEnvironmentVariable(
                'EASYPOST_API_KEY',
            ),

        fromAddress: {
            name:
                requiredEnvironmentVariable(
                    'EASYPOST_FROM_NAME',
                ),

            street1:
                requiredEnvironmentVariable(
                    'EASYPOST_FROM_STREET1',
                ),

            ...(optionalEnvironmentVariable(
                'EASYPOST_FROM_STREET2',
            )
                ? {
                    street2:
                        optionalEnvironmentVariable(
                            'EASYPOST_FROM_STREET2',
                        ),
                }
                : {}),

            city:
                requiredEnvironmentVariable(
                    'EASYPOST_FROM_CITY',
                ),

            state:
                requiredEnvironmentVariable(
                    'EASYPOST_FROM_STATE',
                ),

            zip:
                requiredEnvironmentVariable(
                    'EASYPOST_FROM_ZIP',
                ),

            country:
                'US',
        },

        testParcel: {
            length:
                positiveNumberEnvironmentVariable(
                    'EASYPOST_TEST_PARCEL_LENGTH_IN',
                ),

            width:
                positiveNumberEnvironmentVariable(
                    'EASYPOST_TEST_PARCEL_WIDTH_IN',
                ),

            height:
                positiveNumberEnvironmentVariable(
                    'EASYPOST_TEST_PARCEL_HEIGHT_IN',
                ),

            weight:
                positiveNumberEnvironmentVariable(
                    'EASYPOST_TEST_PARCEL_WEIGHT_OZ',
                ),
        },
    };
}

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !== null &&
        !Array.isArray(
            value,
        )
    );
}

function getEasyPostErrorMessage(
    value: unknown,
): string {
    if (
        !isRecord(
            value,
        )
    ) {
        return 'EasyPost returned an unexpected response.';
    }

    const error =
        value.error;

    if (
        typeof error ===
        'string'
    ) {
        return error;
    }

    if (
        isRecord(
            error,
        ) &&
        typeof error.message ===
        'string'
    ) {
        return error.message;
    }

    return 'EasyPost could not calculate shipping rates.';
}

async function easyPostRequest(
    path: string,

    init:
        RequestInit,
): Promise<unknown> {
    const config =
        getRuntimeConfig();

    const authorization =
        Buffer.from(
            `${config.apiKey}:`,
        ).toString(
            'base64',
        );

    const response =
        await fetch(
            `${EASYPOST_API_ORIGIN}${path}`,
            {
                ...init,

                headers: {
                    Authorization:
                        `Basic ${authorization}`,

                    Accept:
                        'application/json',

                    'Content-Type':
                        'application/json',

                    ...init.headers,
                },
            },
        );

    const payload =
        await response
            .json()
            .catch(
                () => null,
            );

    if (
        !response.ok
    ) {
        throw new Error(
            getEasyPostErrorMessage(
                payload,
            ),
        );
    }

    return payload;
}

function parseShipment(
    value: unknown,
): EasyPostShipment {
    if (
        !isRecord(
            value,
        ) ||
        typeof value.id !==
        'string' ||
        !Array.isArray(
            value.rates,
        )
    ) {
        throw new Error(
            'EasyPost returned an invalid Shipment.',
        );
    }

    const rates:
        EasyPostRate[] =
        value.rates
            .filter(
                isRecord,
            )
            .flatMap(
                (rate) => {
                    if (
                        typeof rate.id !==
                        'string' ||
                        typeof rate.carrier !==
                        'string' ||
                        typeof rate.service !==
                        'string' ||
                        typeof rate.rate !==
                        'string' ||
                        typeof rate.currency !==
                        'string' ||
                        typeof rate.shipment_id !==
                        'string'
                    ) {
                        return [];
                    }

                    return [
                        {
                            id:
                                rate.id,

                            carrier:
                                rate.carrier,

                            service:
                                rate.service,

                            rate:
                                rate.rate,

                            currency:
                                rate.currency,

                            delivery_days:
                                typeof rate.delivery_days ===
                                    'number'
                                    ? rate.delivery_days
                                    : null,

                            est_delivery_days:
                                typeof rate.est_delivery_days ===
                                    'number'
                                    ? rate.est_delivery_days
                                    : null,

                            shipment_id:
                                rate.shipment_id,
                        },
                    ];
                },
            );

    return {
        id:
            value.id,

        mode:
            value.mode ===
                'production'
                ? 'production'
                : 'test',

        rates,
    };
}

export async function createRatedTestShipment(
    toAddress:
        EasyPostAddress,

    reference: string,
): Promise<EasyPostShipment> {
    const config =
        getRuntimeConfig();

    const payload =
        await easyPostRequest(
            '/shipments',
            {
                method:
                    'POST',

                body:
                    JSON.stringify({
                        shipment: {
                            reference,

                            to_address:
                                toAddress,

                            from_address:
                                config
                                    .fromAddress,

                            parcel:
                                config
                                    .testParcel,

                            options: {
                                label_size:
                                    '4x6',

                                label_format:
                                    'PNG',
                            },
                        },
                    }),
            },
        );

    const shipment =
        parseShipment(
            payload,
        );

    if (
        shipment.mode !==
        'test'
    ) {
        throw new Error(
            'EasyPost returned a production shipment while MaxiPawz is in Sandbox.',
        );
    }

    return shipment;
}

export async function retrieveTestShipment(
    shipmentId: string,
): Promise<EasyPostShipment> {
    if (
        !shipmentId.startsWith(
            'shp_',
        )
    ) {
        throw new Error(
            'The EasyPost Shipment ID is invalid.',
        );
    }

    const payload =
        await easyPostRequest(
            `/shipments/${encodeURIComponent(
                shipmentId,
            )}`,
            {
                method:
                    'GET',
            },
        );

    return parseShipment(
        payload,
    );
}