export function getRandomIp() {
  return Array.from({ length: 4 }, () => (
    Math.floor(Math.random() * 256)
  ).toString(10)).join(".");
}