export function getTimezones() {
  if (typeof Intl.supportedValuesOf !== "function") return [];

  return Intl.supportedValuesOf("timeZone").map((tz) => {
    const now = new Date();

    const offset = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value;

    return {
      value: tz,
      label: `(${offset}) ${tz.replace("_", " ")}`,
    };
  });
}