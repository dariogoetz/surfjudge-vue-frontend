export default function (number, decimals) {
  return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals)
}
