import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyAn9L3zdvL39DZGHnXM3XmiJAPyNZgr5c8",
    authDomain: "aridiitechadmin.firebaseapp.com",
    projectId: "aridiitechadmin",
    storageBucket: "aridiitechadmin.firebasestorage.app",
    messagingSenderId: "623026525253",
    appId: "1:623026525253:web:b80ffb3324a68314d33f2c",
    measurementId: "G-EY8B6BY289"
  };


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "admin-dashboard.html";
    })
    .catch(() => {
      alert("Login failed");
    });
});
