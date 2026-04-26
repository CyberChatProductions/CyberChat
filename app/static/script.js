let ws;
let username;
let currentUser = null;
let users = [];

function login() {
    username = document.getElementById("nameInput").value.trim();

    if (!username) {
        alert("Введите имя");
        return;
    }

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
    };

    ws.onmessage = (event) => {
        addMessage(event.data);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
}

function addUser() {
    const name = prompt("Введите имя пользователя");
    if (!name || users.includes(name)) return;

    users.push(name);
    renderUsers();
}

function renderUsers() {
    const box = document.getElementById("users");
    box.innerHTML = "";

    users.forEach(u => {
        const div = document.createElement("div");
        div.className = "user" + (u === currentUser ? " active" : "");
        div.textContent = u;

        div.onclick = () => {
            currentUser = u;
            renderUsers();
            clearChat();
        };

        box.appendChild(div);
    });
}

function send() {
    const input = document.getElementById("msgInput");
    const msg = input.value.trim();

    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);
    addMessage("You: " + msg);

    input.value = "";
}

function addMessage(text) {
    const messages = document.getElementById("messages");

    const div = document.createElement("div");
    div.textContent = text;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function clearChat() {
    document.getElementById("messages").innerHTML = "";
}
