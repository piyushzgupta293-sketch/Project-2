const form=document.getElementById("authForm");
const title=document.getElementById("formTitle");
const subtitle=document.getElementById("formSubtitle");
const submit=document.getElementById("submitButton");
const switchButton=document.getElementById("switchButton");
const switchText=document.getElementById("switchText");
const confirmWrap=document.getElementById("confirmWrap");
const confirmPassword=document.getElementById("confirmPassword");
const message=document.getElementById("message");

let registerMode=false;

switchButton.addEventListener("click",()=>{
  registerMode=!registerMode;
  title.textContent=registerMode?"Create account":"Welcome back";
  subtitle.textContent=registerMode?"Register a new account":"Login to your account";
  submit.textContent=registerMode?"Register":"Login";
  switchText.textContent=registerMode?"Already have an account?":"Don't have an account?";
  switchButton.textContent=registerMode?"Login":"Register";
  confirmWrap.classList.toggle("hidden",!registerMode);
  confirmPassword.required=registerMode;
  message.textContent="";
});

form.addEventListener("submit",(event)=>{
  event.preventDefault();
  if(registerMode && confirmPassword.value!==document.getElementById("password").value){
    message.textContent="Passwords do not match.";
    return;
  }
  message.textContent=registerMode
    ?"Registration will be connected to Supabase next."
    :"Login will be connected to Supabase next.";
});
