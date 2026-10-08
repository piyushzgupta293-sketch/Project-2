const form = document.getElementById("authForm");
const title = document.getElementById("formTitle");
const subtitle = document.getElementById("formSubtitle");
const submit = document.getElementById("submitButton");
const switchButton = document.getElementById("switchButton");
const switchText = document.getElementById("switchText");
const confirmWrap = document.getElementById("confirmWrap");
const confirmPassword = document.getElementById("confirmPassword");
const password = document.getElementById("password");
const email = document.getElementById("email");
const message = document.getElementById("message");

let registerMode = false;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b00020" : "#111";
}

switchButton.addEventListener("click", () => {
  registerMode = !registerMode;
  title.textContent = registerMode ? "Create account" : "Welcome back";
  subtitle.textContent = registerMode ? "Register a new account" : "Login to your account";
  submit.textContent = registerMode ? "Register" : "Login";
  switchText.textContent = registerMode ? "Already have an account?" : "Don't have an account?";
  switchButton.textContent = registerMode ? "Login" : "Register";
  confirmWrap.classList.toggle("hidden", !registerMode);
  confirmPassword.required = registerMode;
  password.autocomplete = registerMode ? "new-password" : "current-password";
  showMessage("");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");
  submit.disabled = true;
  submit.textContent = registerMode ? "Creating account..." : "Logging in...";

  try {
    if (registerMode) {
      if (password.value !== confirmPassword.value) {
        showMessage("Passwords do not match.", true);
        return;
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email: email.value.trim(),
        password: password.value
      });

      if (error) throw error;

      if (data.session) {
        showMessage("Account created. You are now logged in.");
      } else {
        showMessage("Account created. You can now log in.");
        registerMode = false;
        title.textContent = "Welcome back";
        subtitle.textContent = "Login to your account";
        submit.textContent = "Login";
        switchText.textContent = "Don't have an account?";
        switchButton.textContent = "Register";
        confirmWrap.classList.add("hidden");
        confirmPassword.required = false;
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value
      });

      if (error) throw error;

      showMessage("Login successful.");
    }
  } catch (error) {
    showMessage(error.message || "Something went wrong.", true);
  } finally {
    submit.disabled = false;
    submit.textContent = registerMode ? "Register" : "Login";
  }
});
