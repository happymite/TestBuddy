const HOME = {
  student: "/dashboard",
  teacher: "/teacher",
  admin: "/admin",
};

// The database constraint only allows these three roles, so the
// fallback should never run. It exists so we never return `undefined`.
export function homePathFor(role) {
  return HOME[role] ?? "/dashboard";
}