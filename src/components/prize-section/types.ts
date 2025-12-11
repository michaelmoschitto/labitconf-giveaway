export interface PrizeTierDict {
  title: string;
  amount: string;
  winners: string;
  total: string;
}

export interface PrizeSectionProps {
  dict: {
    prizes: {
      title: string;
      subtitle: string;
      tiers: {
        grand: PrizeTierDict;
        secondary: PrizeTierDict;
        intermediate: PrizeTierDict;
        base: PrizeTierDict;
      };
      totalPrize: string;
      totalAmount: string;
      inBitcoin: string;
      totalWinners: string;
      distributionInfo: string;
      drawDate: string;
    };
  };
}
