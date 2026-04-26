console.log("JS LOADED");

let ws;
let username;
let currentUser = null;
let users = [];

function login() {
    console.log("LOGIN CLICKED");

    username = document.getElementById("nameInput").value;

    if (!username) {
        alert("Введите имя");
        return;
    }

    ws = new WebSocket(`wss://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
    };

    ws.onmessage = (event) => {
        const msg = document.getElementById("messages");
        const div = document.createElement("div");
        div.textContent = event.data;
        msg.appendChild(div);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
}

function addUser() {
    const name = prompt("Enter username");
    if (!name || users.includes(name)) return;

    users.push(name);
    renderUsers();
}

function renderUsers() {
    const box = document.getElementById("users");
    box.innerHTML = "";

    users.forEach(u => {
        const div = document.createElement("div");
        div.textContent = u;
        div.onclick = () => currentUser = u;
        box.appendChild(div);
    });
}

function send() {
    const msg = document.getElementById("msgInput").value;

    if (!currentUser || !msg) {
        alert("Выбери пользователя и введи сообщение");
        return;
    }

    ws.send(currentUser + "|" + msg);

    const messages = document.getElementById("messages");
    const div = document.createElement("div");
    div.textContent = "You: " + msg;
    messages.appendChild(div);

    document.getElementById("msgInput").value = "";
}
