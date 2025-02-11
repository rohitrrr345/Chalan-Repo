  export interface TruckChallan {
    rc_number: string;
    totalAmount: number;
    count: number;
}

export  interface TruckAverage {
    rc_number: string;
    average_challan_amount: number;
}

export interface ChallanByMonth {
  month: string;
  year: number;
  total_challans: number;
}


  export interface PendingChallan {
  rc_number: string;
  accused_name: string;
  challan_number: string;
  challan_date: Date;
  days_pending: number;
}

export interface RepeatOffender {
  rc_number: string;
  accused_name: string;
  total_challans: number;
}
