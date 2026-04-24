const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx-4qvTpFNhyVNIt4i3_6ElJlMtYbI6uVXsOIHiFG8FwmEnVparX0njYxZ1unWLfRyn/exec";

export async function callApi(payload) {
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export function registerUser(
  firstName,
  lastName,
  email,
  phone,
  gender,
  race,
  household,
  religion,
  foodPref,
) {
  return callApi({
    action: "registerUser",
    firstName,
    lastName,
    email,
    phone,
    gender,
    raceEthnicity: race,
    household,
    religion,
    foodPref,
  });
}

export function logVisit(userId, method, source) {
  return callApi({ action: "logVisit", userId, checkInMethod: method, handledBy: source });
}

export function recoverUser(identifier) {
  return callApi({ action: "recoverUser", identifier });
}

export function adminSignIn(email, passcode) {
  return callApi({ action: "adminSignIn", email, passcode });
}

export function adminSearchUserByName(name) {
  return callApi({ action: "adminSearchUserByName", name });
}

export function registerAdmin(fullName, email, phone, role, createdBy) {
  return callApi({ action: "registerAdmin", fullName, email, phone, role, createdBy });
}

export function recoverAdminCredentialsByName(name) {
  return callApi({ action: "recoverAdminCredentialsByName", name });
}

export function revokeAdmin(staffId, revokedBy) {
  return callApi({ action: "revokeAdmin", staffId, revokedBy });
}

export function getAdminStats() {
  return callApi({ action: "getAdminStats" });
}

export { SCRIPT_URL };
