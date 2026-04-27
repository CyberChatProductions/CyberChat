let ws;
let username;

function showError(text) {
    document.getElementById("error").innerText = text;
}


// ---------------- REGISTER ----------------
async function register() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;

    const res = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u, password: p})
    });

    const data = await res.json();

    if (!data.ok) {
        if (data.error === "username_taken") {
            showError("логин уже используется");
        } else if (data.error === "invalid_username") {
            showError("недопустимые символы");
        } else {
            showError("произошла ошибка, обратитесь к Кубику т.к. он опять наломал дров");
        }
        return;
    }

    showError("зарегистрировано");
}


// ---------------- LOGIN ----------------
async function login() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u, password: p})
    });

    const data = await res.json();

    if (!data.ok) {
        if (data.error === "no_user") {
            showError("неверный логин или пароль");
        } else if (data.error === "bad_password") {
            showError("неверный логин или пароль");
        } else {
            showError("произошла ошибка, обратитесь к Кубику т.к. он опять наломал дров");
        }
        return;
    }

    username = u;

    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
}
