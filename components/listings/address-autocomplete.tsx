"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";

/**
 * Wraps the address <input> with Google Places Autocomplete so people pick a
 * real, correctly-spelled address. If no Maps key is configured, it silently
 * behaves as a plain text field. The chosen address is written back into the
 * same input, so the form submit (and server-side geocoding) is unchanged.
 */
export function AddressAutocomplete(props: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!key || !ref.current) return;
    done.current = true;

    let autocomplete: google.maps.places.Autocomplete | null = null;

    (async () => {
      try {
        const loader = new Loader({ apiKey: key, version: "weekly" });
        await loader.importLibrary("places");
        if (!ref.current) return;

        autocomplete = new google.maps.places.Autocomplete(ref.current, {
          fields: ["formatted_address"],
          types: ["address"],
          componentRestrictions: { country: "us" },
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete!.getPlace();
          if (place.formatted_address && ref.current) {
            ref.current.value = place.formatted_address;
          }
        });
      } catch {
        /* leave the plain input in place */
      }
    })();

    return () => {
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, []);

  return <Input ref={ref} autoComplete="off" {...props} />;
}
