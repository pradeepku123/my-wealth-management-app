export interface Goal {
    id?: number;
    name: string;
    target_amount: number;
    target_date: string;
    monthly_sip_amount: number;
    current_amount?: number;
    progress?: number;
    linked_investments?: number[];
}
