'use client';

import { useEffect, useState } from 'react';

export default function TimezoneAutoDetect() {
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, []);

  return (
    <div className="text-white">
      Detected Timezone: {timezone}
    </div>
  );
}