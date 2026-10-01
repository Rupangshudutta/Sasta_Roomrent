import {
  ArrowUpDown,
  Bath,
  BatteryCharging,
  Car,
  Cctv,
  Check,
  CookingPot,
  DoorOpen,
  Droplets,
  Dumbbell,
  GlassWater,
  LampDesk,
  Paintbrush,
  Refrigerator,
  ShieldCheck,
  Shirt,
  Snowflake,
  Tv,
  Utensils,
  WashingMachine,
  Wifi,
  type LucideProps,
} from "lucide-react";

/**
 * Maps the `amenities.icon` key stored in the database to a lucide icon.
 * Unknown keys fall back to a check mark, so adding an amenity in the admin
 * never breaks rendering.
 */
const icons = {
  wifi: Wifi,
  snowflake: Snowflake,
  utensils: Utensils,
  "washing-machine": WashingMachine,
  car: Car,
  "shield-check": ShieldCheck,
  cctv: Cctv,
  dumbbell: Dumbbell,
  "battery-charging": BatteryCharging,
  droplets: Droplets,
  "arrow-up-down": ArrowUpDown,
  "cooking-pot": CookingPot,
  refrigerator: Refrigerator,
  tv: Tv,
  "glass-water": GlassWater,
  "brush-cleaning": Paintbrush,
  "door-open": DoorOpen,
  bath: Bath,
  "lamp-desk": LampDesk,
  shirt: Shirt,
  check: Check,
} as const;

export function AmenityIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = icons[name as keyof typeof icons] ?? Check;
  return <Icon aria-hidden {...props} />;
}
