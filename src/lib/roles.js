export const ROLES = {
  RENTER: 'renter',
  OWNER: 'owner',
  ADMIN: 'admin',
}

export function getRoles(profile) {
  return profile?.roles ?? []
}

export function hasRole(profile, role) {
  return getRoles(profile).includes(role)
}

export function isAdmin(profile) {
  return hasRole(profile, ROLES.ADMIN)
}

export function isOwner(profile) {
  return hasRole(profile, ROLES.OWNER)
}

/** Owner dashboard and owner nav (owners and admins). */
export function canUseOwnerView(profile) {
  return isOwner(profile) || isAdmin(profile)
}
