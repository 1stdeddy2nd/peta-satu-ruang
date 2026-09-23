// Interpolated into SQL, so this must stay a fixed lookup and never take a
// value from the request.
export const BUILDING_PCODE_COLUMN: Record<number, string> = {
  1: "provincePcode",
  2: "regencyPcode",
  3: "districtPcode",
  4: "villagePcode",
};
