const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyD6mdYJ0-l7_FR0unLH-oOedvlJ9ONgxa-V2CH2H0kA8AgKxccjrlXY91B4HkYclvG/exec";

export async function callApi(payload) {
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export { SCRIPT_URL };
