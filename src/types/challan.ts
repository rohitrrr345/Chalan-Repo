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
  export interface ChallanDetails {
  challan_number: string;
  accused_name: string;
  offense_details: string;
  challan_date: Date;
  amount: number;
  challan_status: string;
}

export interface PendingChallanStats {
  total_pending_challans: number;
  court_challan_pending: number;
  online_challan_pending: number;
  court_challan_percentage: number;
  online_challan_percentage: number;
}

   export interface myType  {
  challan_date?: {
      gte: Date;
      lte: Date;
  };
};
