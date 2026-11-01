const HOME = {
  student: "/dashboard",
  admin: "/admin",
};

export function homePathFor(role) {
  return HOME[role] ?? "/dashboard";
}
