/**
 * Helper utility for sending authenticated Admin API requests.
 * Automatically attaches the Authorization header with the plain password from localStorage.
 * If any request receives a 401 Unauthorized response, it immediately clears localStorage
 * and redirects the user to /admin-login.
 */
export async function adminFetch(url, options = {}) {
  const adminPassword = localStorage.getItem("adminPassword") || "";
  
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${adminPassword}`,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      console.warn("[adminFetch] 401 Unauthorized encountered. Logging out admin...");
      localStorage.removeItem("adminPassword");
      localStorage.removeItem("adminAuthed");
      window.dispatchEvent(new Event("admin-unauthorized"));
      if (window.location.pathname !== "/admin-login") {
        window.location.href = "/admin-login";
      }
    }
    
    return res;
  } catch (err) {
    console.error("[adminFetch] Network or fetch error:", err);
    throw err;
  }
}
