import React from "react";
import { RestrictedAlert } from "./RestrictedAlert";
import { MedicineCard } from "./MedicineCard";
import { PriceTable } from "./PriceTable";
import { AlternativesCard } from "./AlternativesCard";

interface CardRegistryProps {
  card: {
    type: string;
    id?: string;
    data: any;
  };
}

export function CardRenderer({ card }: CardRegistryProps) {
  if (!card || !card.type) return null;

  switch (card.type) {
    case "restricted_alert":
      return <RestrictedAlert data={card.data} />;
    case "medicine":
      return <MedicineCard data={card.data} />;
    case "price_table":
      return <PriceTable data={card.data} />;
    case "alternatives":
      return <AlternativesCard data={card.data} />;
    default:
      return null;
  }
}
