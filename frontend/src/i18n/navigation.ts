import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation primitives — komponentlarda next/link/router o'rniga ishlatiladi.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
