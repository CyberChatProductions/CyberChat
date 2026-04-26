console.log("JS LOADED");

let ws;
let username;
let currentUser = null;

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
        loadDialogs();
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
}

async function loadDialogs() {
    const res = await fetch(`/dialogs/${username}`);
    const data = await res.json();

    const box = document.getElementById("users");
    box.innerHTML = "";

    data.forEach(u => renderUser(u));
}

// 📌 РЕНДЕР пользователя (НОРМАЛЬНАЯ ФУНКЦИЯ)
function renderUser(name) {
    const box = document.getElementById("users");

    const div = document.createElement("div");
    div.className = "user";
    div.innerText = name;

    div.onclick = () => {
        currentUser = name;
        document.getElementById("messages").innerHTML = "";
        ws.send("history|" + name);
    };

    box.appendChild(div);
}

// 📌 ДОБАВЛЕНИЕ ЧАТА (ИСПРАВЛЕНО)
function addUser() {
    const name = prompt("Enter username:");
    if (!name) return;

    renderUser(name);
}

function send() {
    const msg = document.getElementById("msgInput").value;
    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);
    document.getElementById("msgInput").value = "";
}

function addMessage(sender, msg) {
    const box = document.getElementById("messages");

    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");

    div.innerText = sender === username ? msg : sender + ": " + msg;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}
