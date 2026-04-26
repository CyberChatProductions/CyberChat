let ws;
let username;
let currentUser = null;
let users = [];

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
}

function addUser() {
    const name = prompt("Username:");
    if (!name || users.includes(name)) return;

    users.push(name);

    const div = document.createElement("div");
    div.className = "user";
    div.innerText = name;

    div.onclick = () => {
        currentUser = name;
        document.getElementById("messages").innerHTML = "";
    };

    document.getElementById("users").appendChild(div);
}

function send() {
    const msg = document.getElementById("msgInput").value;
    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);

    addMessage(username, msg);
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
