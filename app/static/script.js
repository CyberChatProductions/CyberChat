let ws;
let username;
let currentUser;

const usersBox = document.getElementById("users");
const messagesBox = document.getElementById("messages");

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
    loadUsers();
}

function connectWS() {
    const protocol = location.protocol === "https:" ? "wss" : "ws";

    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };
}

async function loadUsers() {
    const res = await fetch(`/users/${username}`);
    const users = await res.json();

    usersBox.innerHTML = "";

    users.forEach(u => {
        const div = document.createElement("div");
        div.className = "user";
        div.innerText = u;
        div.onclick = () => openChat(u);
        usersBox.appendChild(div);
    });
}

function addUser() {
    const name = prompt("Username:");
    if (!name) return;

    openChat(name);
}

async function openChat(user) {
    currentUser = user;
    messagesBox.innerHTML = "";

    const res = await fetch(`/history/${username}/${user}`);
    const history = await res.json();

    history.forEach(m => addMessage(m.sender, m.content));
}

function send() {
    const msg = document.getElementById("msgInput").value.trim();
    if (!msg || !currentUser) return;

    ws.send(currentUser + "|" + msg);
    document.getElementById("msgInput").value = "";
}

function addMessage(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");
    div.innerText = msg;

    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}
