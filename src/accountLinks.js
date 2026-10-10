export function accountLinks(profile) {
  return [
    { label: "View profile", path: "/profile" },
    { label: "Your stats", path: "/profile#history" },
    ...(profile?.published && profile.handle
      ? [{ label: "View public page", path: `/u/${profile.handle}` }]
      : []),
  ];
}
