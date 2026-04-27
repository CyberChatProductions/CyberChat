let ws;
let username;
let currentChat = null;

// ---------------- AUTH ----------------
function showError(text) {
    document.getElementById("error").innerText = text;
}

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
        showError("ошибка регистрации");
        return;
    }

    showError("зарегистрировано");
}

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
        showError("неверный логин или пароль");
        return;
    }

    username = u;

    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
    loadUsers();
}

// ---------------- WS ----------------
function connectWS() {
    const url =
        (location.protocol === "https:" ? "wss://" : "ws://")
        + location.host + "/ws";

    ws = new WebSocket(url);

    ws.onopen = () => {
        ws.send(username);
    };

    ws.onmessage = (e) => {
        const [from, msg] = e.data.split("|");

        if (from === currentChat) {
            addMsg(from, msg);
        }
    };
}

// ---------------- USERS ----------------
async function loadUsers() {
    const res = await fetch(`/users/${username}`);
    const users = await res.json();

    const box = document.getElementById("users");
    box.innerHTML = "";

    users.forEach(u => {
        const div = document.createElement("div");
        div.className = "user";
        div.innerText = u;

        div.onclick = () => openChat(u);

        box.appendChild(div);
    });
}

// ---------------- ADD USER ----------------
function addUser() {
    const name = prompt("Enter username:");
    if (!name) return;

    fetch("/add_user", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, target: name})
    }).then(() => {
        loadUsers();
        openChat(name);
    });
}

// ---------------- CHAT ----------------
async function openChat(user) {
    currentChat = user;

    document.getElementById("chatName").innerText = user;
    document.getElementById("messages").innerHTML = "";

    const res = await fetch(`/history/${username}/${user}`);
    const data = await res.json();

    data.forEach(m => addMsg(m.sender, m.content));
}

function send() {
    const msg = document.getElementById("msgInput").value;
    if (!msg || !currentChat) return;

    ws.send(currentChat + "|" + msg);
    document.getElementById("msgInput").value = "";
}

function addMsg(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");
    div.innerText = msg;

    document.getElementById("messages").appendChild(div);
}
