let ws;
let username;
let currentUser = null;
let users = [];

function login() {
    username = document.getElementById("nameInput").value;
    if (!username) return;

    ws = new WebSocket(`wss://${location.host}/ws`);

    ws.onopen = () => ws.send(username);

    ws.onmessage = (event) => {
        const msg = document.getElementById("messages");
        const div = document.createElement("div");
        div.textContent = event.data;
        msg.appendChild(div);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
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
        div.className = "user";
        div.textContent = u;

        div.onclick = () => {
            currentUser = u;
            loadHistory(u);
        };

        box.appendChild(div);
    });
}

function loadHistory(user) {
    const messages = document.getElementById("messages");
    messages.innerHTML = "";

    ws.send("history|" + user);
}

function send() {
    const msg = document.getElementById("msgInput").value;
    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);

    const messages = document.getElementById("messages");
    const div = document.createElement("div");
    div.textContent = "You: " + msg;
    messages.appendChild(div);

    document.getElementById("msgInput").value = "";
}
