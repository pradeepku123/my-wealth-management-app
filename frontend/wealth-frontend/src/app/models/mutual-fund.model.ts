export interface MutualFund {
    scheme_code: string;
    scheme_name: string;
    nav: number;
    nav_date: string;
    fund_house?: string;
    category?: string;
    sub_category?: string;
    rolling_return?: number;
}
