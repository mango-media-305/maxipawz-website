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

    delivery_days?:
    | number
    | null;

    est_delivery_days?:
    | number
    | null;

    shipment_id: string;
}

export interface EasyPostPostageLabel {
    label_url: string;

    label_pdf_url?:
    | string
    | null;

    label_zpl_url?:
    | string
    | null;
}

export interface EasyPostTracker {
    id: string;

    tracking_code: string;

    status?: string;

    public_url?:
    | string
    | null;
}

export interface EasyPostShipment {
    id: string;

    mode:
    | 'test'
    | 'production';

    status?:
    | string
    | null;

    rates:
    EasyPostRate[];

    selected_rate?:
    | EasyPostRate
    | null;

    tracking_code?:
    | string
    | null;

    postage_label?:
    | EasyPostPostageLabel
    | null;

    tracker?:
    | EasyPostTracker
    | null;
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

    if (!value) {
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

    const street2 =
        optionalEnvironmentVariable(
            'EASYPOST_FROM_STREET2',
        );

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

            ...(street2
                ? {
                    street2,
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

    return 'EasyPost could not process the shipment.';
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

function parseRate(
    value: unknown,
): EasyPostRate | null {
    if (
        !isRecord(
            value,
        ) ||
        typeof value.id !==
        'string' ||
        typeof value.carrier !==
        'string' ||
        typeof value.service !==
        'string' ||
        typeof value.rate !==
        'string' ||
        typeof value.currency !==
        'string' ||
        typeof value.shipment_id !==
        'string'
    ) {
        return null;
    }

    return {
        id:
            value.id,

        carrier:
            value.carrier,

        service:
            value.service,

        rate:
            value.rate,

        currency:
            value.currency,

        delivery_days:
            typeof value.delivery_days ===
                'number'
                ? value.delivery_days
                : null,

        est_delivery_days:
            typeof value.est_delivery_days ===
                'number'
                ? value.est_delivery_days
                : null,

        shipment_id:
            value.shipment_id,
    };
}

function parsePostageLabel(
    value: unknown,
): EasyPostPostageLabel | null {
    if (
        !isRecord(
            value,
        ) ||
        typeof value.label_url !==
        'string' ||
        !value.label_url
    ) {
        return null;
    }

    return {
        label_url:
            value.label_url,

        label_pdf_url:
            typeof value.label_pdf_url ===
                'string'
                ? value.label_pdf_url
                : null,

        label_zpl_url:
            typeof value.label_zpl_url ===
                'string'
                ? value.label_zpl_url
                : null,
    };
}

function parseTracker(
    value: unknown,
): EasyPostTracker | null {
    if (
        !isRecord(
            value,
        ) ||
        typeof value.id !==
        'string' ||
        typeof value.tracking_code !==
        'string'
    ) {
        return null;
    }

    return {
        id:
            value.id,

        tracking_code:
            value.tracking_code,

        status:
            typeof value.status ===
                'string'
                ? value.status
                : undefined,

        public_url:
            typeof value.public_url ===
                'string'
                ? value.public_url
                : null,
    };
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

    const rates =
        value.rates
            .map(
                parseRate,
            )
            .filter(
                (
                    rate,
                ): rate is EasyPostRate =>
                    rate !== null,
            );

    const selectedRate =
        parseRate(
            value.selected_rate,
        );

    return {
        id:
            value.id,

        mode:
            value.mode ===
                'production'
                ? 'production'
                : 'test',

        status:
            typeof value.status ===
                'string'
                ? value.status
                : null,

        rates,

        selected_rate:
            selectedRate,

        tracking_code:
            typeof value.tracking_code ===
                'string'
                ? value.tracking_code
                : null,

        postage_label:
            parsePostageLabel(
                value.postage_label,
            ),

        tracker:
            parseTracker(
                value.tracker,
            ),
    };
}

function assertTestShipment(
    shipment:
        EasyPostShipment,
): void {
    if (
        shipment.mode !==
        'test'
    ) {
        throw new Error(
            'EasyPost returned a production Shipment while MaxiPawz is in Sandbox.',
        );
    }
}

export function isPurchasedShipment(
    shipment:
        EasyPostShipment,
): boolean {
    return Boolean(
        shipment
            .tracking_code &&
        shipment
            .postage_label
            ?.label_url,
    );
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

    assertTestShipment(
        shipment,
    );

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

    const shipment =
        parseShipment(
            payload,
        );

    assertTestShipment(
        shipment,
    );

    return shipment;
}

export async function buyTestShipmentRate(
    shipmentId: string,
    rateId: string,
): Promise<EasyPostShipment> {
    if (
        !rateId.startsWith(
            'rate_',
        )
    ) {
        throw new Error(
            'The EasyPost Rate ID is invalid.',
        );
    }

    const existingShipment =
        await retrieveTestShipment(
            shipmentId,
        );

    if (
        isPurchasedShipment(
            existingShipment,
        )
    ) {
        return existingShipment;
    }

    const rate =
        existingShipment
            .rates
            .find(
                (
                    shipmentRate,
                ) =>
                    shipmentRate.id ===
                    rateId,
            );

    if (!rate) {
        throw new Error(
            'The selected EasyPost Rate does not belong to this Shipment.',
        );
    }

    try {
        const payload =
            await easyPostRequest(
                `/shipments/${encodeURIComponent(
                    shipmentId,
                )}/buy`,
                {
                    method:
                        'POST',

                    body:
                        JSON.stringify({
                            rate: {
                                id:
                                    rateId,
                            },
                        }),
                },
            );

        const purchasedShipment =
            parseShipment(
                payload,
            );

        assertTestShipment(
            purchasedShipment,
        );

        if (
            !isPurchasedShipment(
                purchasedShipment,
            )
        ) {
            throw new Error(
                'EasyPost did not return a completed test label purchase.',
            );
        }

        return purchasedShipment;
    } catch (error) {
        /**
         * A webhook retry could happen after EasyPost successfully
         * purchased the label but before MaxiPawz persisted the result.
         *
         * Retrieve the Shipment again before treating the operation as
         * failed. If it is already purchased, reuse that label instead
         * of attempting to buy another one.
         */
        const recoveredShipment =
            await retrieveTestShipment(
                shipmentId,
            );

        if (
            isPurchasedShipment(
                recoveredShipment,
            )
        ) {
            return recoveredShipment;
        }

        throw error;
    }
}