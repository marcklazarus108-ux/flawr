import { useEffect, useRef } from "react";

// Renders Google's official Sign-In button and forwards the resulting
// credential (ID token) to onCredential. Requires VITE_GOOGLE_CLIENT_ID
// to be set, and the GIS script (loaded in index.html).
export default function GoogleButton({ onCredential }) {
  const divRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || !divRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onCredential(response.credential),
    });

    window.google.accounts.id.renderButton(divRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
    });
  }, [onCredential]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return (
      <p className="text-xs text-neutral-400 text-center">
        Google sign-in isn't configured yet. Add VITE_GOOGLE_CLIENT_ID to enable it.
      </p>
    );
  }

  return <div ref={divRef} className="flex justify-center" />;
}
