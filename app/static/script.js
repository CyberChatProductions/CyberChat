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
        loadDialogs(); // 🔥 загружаем диалоги
    };

    ws.onmessage = (event) => {
        const [sender, text] = event.data.split("|");
        addMessage(sender, text);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
}

// 🔥 загрузка диалогов
async function loadDialogs() {
    const res = await fetch(`/dialogs/${username}`);
    const users = await res.json();

    const box = document.getElementById("users");
    box.innerHTML = "";

    users.forEach(u => {
        addUserToList(u);
    });
}

// 🔥 добавление в список
function addUserToList(name) {
    const box = document.getElementById("users");

    const div = document.createElement("div");
    div.className = "user";
    div.textContent = name;

    div.onclick = () => {
        currentUser = name;
        clearChat();
        ws.send("history|" + name);
    };

    box.appendChild(div);
}

// кнопка +
function addUser() {
    const name = prompt("Введите имя");
    if (!name) return;

    addUserToList(name);
}

// отправка
function send() {
    const input = document.getElementById("msgInput");
    const msg = input.value.trim();

    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);
    input.value = "";
}

// вывод сообщений
function addMessage(sender, text) {
    if (!currentUser) return;

    const messages = document.getElementById("messages");

    const div = document.createElement("div");

    if (sender === username) {
        div.style.textAlign = "right";
        div.textContent = text;
    } else {
        div.style.textAlign = "left";
        div.textContent = sender + ": " + text;
    }

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function clearChat() {
    document.getElementById("messages").innerHTML = "";
}
