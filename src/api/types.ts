export interface Item {
    unit_cost: string;  // e.g. "100.00"
    quantity?: number;  // default to 1 if omitted
    // more fields if needed
}

export interface ConfigureRequest {
    currency: string;
    items: Item[];
    locale: string;    // e.g. "en_US"
}

export interface Quote {
    coverage_amount: string;
    premium: string;
    reference_id: string;
    quantity: number;
}

export interface ICWResponse {
    token: string;
    token_opt_out: string;
    currency: string;
    symbol: string;
    quote: Quote[];
    quote_total: string;
    quote_literal: string;
    order_total: string;
    order_literal: string;
    legal_content: string;
    legal_content_expander: string;
    perils: Array<{
        icon: string;
        id: string;
        name: string;
    }>;
    links: Array<{ url: string; type: string }>;
    underwriter: {
        name: string;
        legal_name: string;
        id: string;
    };
    // …other fields can be ignored or extended later
}