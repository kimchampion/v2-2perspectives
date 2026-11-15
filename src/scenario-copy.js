export function formatScenarioText(text, participants = []) {
  // A single replacement pass keeps nickname text literal, including $ and brackets.
  return text.replace(/\[User ([12])\]/g, (placeholder, number) => {
    const name = participants[Number(number) - 1]?.name;
    return typeof name === 'string' && name.trim() ? name.trim() : placeholder;
  });
}
