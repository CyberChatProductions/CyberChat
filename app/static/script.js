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
    const url =
        (location.protocol === "https:" ? "wss://" : "ws://")
        + location.host + "/ws";

    ws = new WebSocket(url);

    ws.onopen = () => {
        ws.send(username);
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMsg(sender, msg);
    };

    ws.onclose = () => {
        setTimeout(connectWS, 2000);
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
    const name = prompt("User name:");
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

async function openChat(user) {
    currentUser = user;
    messagesBox.innerHTML = "";

    const res = await fetch(`/history/${username}/${user}`);
    const data = await res.json();

    data.forEach(m => addMsg(m.sender, m.content));
}

function send() {
    const msg = document.getElementById("msgInput").value;
    if (!msg || !currentUser) return;

    ws.send(currentUser + "|" + msg);
    document.getElementById("msgInput").value = "";
}

function addMsg(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");
    div.innerText = msg;

    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}
