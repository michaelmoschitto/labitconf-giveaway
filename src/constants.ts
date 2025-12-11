/**
 * Shared constants and configuration data
 */

interface Prize {
  tier: string;
  amount: number;
  winners: number;
  total: number;
  color: "gold" | "silver" | "bronze" | "blue";
  icon?: string;
}

export const prizeStructure: Prize[] = [
  {
    tier: "Gran Premio",
    amount: 1500,
    winners: 1,
    total: 1500,
    color: "gold",
  },
  {
    tier: "Premios Secundarios",
    amount: 250,
    winners: 6,
    total: 1500,
    color: "silver",
  },
  {
    tier: "Premios Intermedios",
    amount: 40,
    winners: 50,
    total: 2000,
    color: "bronze",
  },
  {
    tier: "Premios Base",
    amount: 20,
    winners: 500,
    total: 10000,
    color: "blue",
  },
];
