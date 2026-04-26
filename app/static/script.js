console.log("JS LOADED");

let ws;
let username;
let currentUser = null;

function login() {
    username = document.getElementById("nameInput").value.trim();

    if (!username) {
        alert("Enter name");
        return;
    }

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        showMessage(sender, msg);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
}

function send() {
    const msg = document.getElementById("msgInput").value;

    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);
    document.getElementById("msgInput").value = "";
}

function showMessage(sender, msg) {
    const box = document.getElementById("messages");

    const div = document.createElement("div");

    if (sender === username) {
        div.style.textAlign = "right";
        div.innerHTML = msg;
    } else {
        div.style.textAlign = "left";
        div.innerHTML = sender + ": " + msg;
    }

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}
