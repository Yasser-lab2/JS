import finduserbymail from "./database.js";

const mail = document.getElementById("mail");
const password = document.getElementById("password");
const submitbtn = document.getElementById("submitbtn");
const display = document.getElementById("display");
const error = document.getElementById("error");

// Toggle password visibility
display.addEventListener("click", () => {
  if (password.type === "password") {
    password.type = "text";
    display.textContent = "🙈";
  } else {
    password.type = "password";
    display.textContent = "👁";
  }
});

// Handle login
submitbtn.addEventListener("click", () => {
  const emailValue = mail.value.trim();
  const passwordValue = password.value.trim();

  // Basic validation
  if (!emailValue || !passwordValue) {
    error.textContent = "Veuillez remplir tous les champs.";
    error.style.color = "red";
    return;
  }

  const user = finduserbymail(emailValue, passwordValue);

  if (user) {
    error.textContent = "";
    sessionStorage.setItem("loggedUser", JSON.stringify(user));
    window.location.href = "/src/view/dashboard.html";
  } else {
    error.textContent = "Email ou mot de passe incorrect.";
    error.style.color = "red";
  }
});
