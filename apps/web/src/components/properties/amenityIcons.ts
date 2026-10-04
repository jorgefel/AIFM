import {
  Check,
  Car,
  Droplets,
  Dumbbell,
  Flame,
  PawPrint,
  Shirt,
  Sun,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
  type LucideIcon,
} from "lucide-react";

const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  kitchen: Utensils,
  pool: Droplets,
  parking: Car,
  ac: Wind,
  heating: Flame,
  sea_view: Waves,
  washer: Shirt,
  tv: Tv,
  gym: Dumbbell,
  terrace: Sun,
  pets: PawPrint,
};

export function getAmenityIcon(id: string): LucideIcon {
  return AMENITY_ICONS[id] ?? Check;
}
