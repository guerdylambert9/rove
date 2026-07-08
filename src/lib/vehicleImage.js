/** Background style for a single photo URL. */
export function photoBackgroundStyle(url, gradient) {
  if (url) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(11,37,69,0.1) 0%, rgba(11,37,69,0.35) 100%), url(${url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return { background: gradient }
}

/** Pick hero/card background: first photo if available, else gradient. */
export function vehicleImageStyle(car) {
  return photoBackgroundStyle(car?.photos?.[0], car?.gradient)
}
