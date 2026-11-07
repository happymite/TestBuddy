import { useEffect, useRef, useState } from "react";

export default function GoogleAuthButton({ onCredential, onError, text = "continue_with" }) {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(Boolean(window.google?.accounts?.id));
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (window.google?.accounts?.id) return setScriptLoaded(true);
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setScriptLoaded(true);
        clearInterval(interval);
      }
    }, 200);
    const timer = setTimeout(() => clearInterval(interval), 10000);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current || !clientId) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) return onError?.("Google authentication failed.");
          setLoading(true);
          try {
            await onCredential(response.credential);
          } catch (err) {
            onError?.(err.message || "Google authentication failed.");
          } finally {
            setLoading(false);
          }
        },
      });

      buttonRef.current.innerHTML = "";
      const cardWidth = buttonRef.current.parentElement?.offsetWidth || 360;
      const targetWidth = Math.min(Math.max(cardWidth, 240), 380);

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text,
        width: targetWidth,
        logo_alignment: "left",
      });
    } catch (err) {
      console.error("Google button init error:", err);
    }
  }, [scriptLoaded, clientId, onCredential, onError, text]);

  function handleFallbackClick() {
    if (!clientId) {
      onError?.("Google Client ID is not configured yet in frontend/.env");
    }
  }

  return (
    <div className="google-auth-wrapper">
      <div className="auth-divider">
        <span className="line" />
        <span className="text">or continue with</span>
        <span className="line" />
      </div>

      <div ref={buttonRef} className="google-btn-container">
        {!clientId && (
          <button
            type="button"
            className="google-fallback-btn"
            onClick={handleFallbackClick}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
            </svg>
            <span>{loading ? "Connecting..." : "Continue with Google"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
