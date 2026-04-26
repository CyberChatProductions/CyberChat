let ws;
let username;
let currentUser = null;

const usersBox = document.getElementById("users");
const messagesBox = document.getElementById("messages");

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
        loadUsers();
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
}

async function loadUsers() {
    const res = await fetch("/users");
    const data = await res.json();

    usersBox.innerHTML = "";

    data.forEach(u => {
        const div = document.createElement("div");
        div.className = "user";
        div.innerText = u;

        div.onclick = () => {
            currentUser = u;
            messagesBox.innerHTML = "";
            ws.send("history|" + u);
        };

        usersBox.appendChild(div);
    });
}

function addUser() {
    const name = prompt("username:");
    if (!name) return;

    const div = document.createElement("div");
    div.className = "user";
    div.innerText = name;

    div.onclick = () => {
        currentUser = name;
        messagesBox.innerHTML = "";
        ws.send("history|" + name);
    };

    usersBox.appendChild(div);
}

function send() {
    const msg = document.getElementById("msgInput").value;
    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);
    document.getElementById("msgInput").value = "";
}

function addMessage(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");

    div.innerText = sender === username ? msg : sender + ": " + msg;

    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}
