const API_BASE = "https://aridiitech-backend.onrender.com/api";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const message = document.getElementById("loginMessage");

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("adminToken", data.token);
    window.location.href = "dashboard.html";
  } catch (error) {
    message.textContent = error.message;
  }
});
