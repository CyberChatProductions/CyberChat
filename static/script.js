let ws;
let username;
let currentChat = null;

let users = JSON.parse(localStorage.getItem("users") || "[]");
let chats = JSON.parse(localStorage.getItem("chats") || "{}");

// 🔑 ключ диалога (один и тот же для двух пользователей)
function getChatKey(user1, user2) {
    return [user1, user2].sort().join("_");
}

// 🔌 подключение
function connect() {
    username = prompt("Enter your name:");

    ws = new WebSocket(`ws://${location.host}/ws/${username}`);

    ws.onmessage = (event) => {
        let data = JSON.parse(event.data);

        if (data.type === "message") {

            let key = getChatKey(data.from, data.to);

            if (!chats[key]) chats[key] = [];

            // ❌ защита от дублей
            let last = chats[key][chats[key].length - 1];
            if (last && last.text === data.text && last.from === data.from) return;

            chats[key].push(data);
            saveChats();

            // показываем только текущий чат
            if (currentChat) {
                let currentKey = getChatKey(username, currentChat);
                if (key === currentKey) {
                    addMessage(data);
                }
            }
        }
    };

    // ✅ Enter
    document.getElementById("msg").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            send();
        }
    });

    updateUsers();
}

// 💾 сохранение
function saveUsers() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveChats() {
    localStorage.setItem("chats", JSON.stringify(chats));
}

// 👥 список пользователей
function updateUsers() {
    let list = document.getElementById("userList");
    list.innerHTML = "";

    users.forEach(u => {
        if (u === username) return;

        let div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.padding = "8px";
        div.style.marginBottom = "5px";
        div.style.borderRadius = "6px";
        div.style.background = u === currentChat ? "#0078ff" : "#333";
        div.style.color = "white";

        let name = document.createElement("span");
        name.innerText = u;
        name.style.cursor = "pointer";

        name.onclick = () => {
            currentChat = u;
            loadChat(u);
            updateUsers();
        };

        let del = document.createElement("button");
        del.innerText = "✖";

        del.onclick = (e) => {
            e.stopPropagation();

            users = users.filter(x => x !== u);

            let key = getChatKey(username, u);
            delete chats[key];

            saveUsers();
            saveChats();

            if (currentChat === u) {
                currentChat = null;
                document.getElementById("chat").innerHTML = "";
            }

            updateUsers();
        };

        div.appendChild(name);
        div.appendChild(del);
        list.appendChild(div);
    });
}

// ➕ добавить пользователя
function addUser() {
    let name = prompt("Enter user name:");

    if (!name || name === username || users.includes(name)) return;

    users.push(name);
    saveUsers();
    updateUsers();
}

// 📥 загрузка чата
function loadChat(user) {
    let chat = document.getElementById("chat");
    chat.innerHTML = "";

    let title = document.createElement("div");
    title.innerText = "Chat with " + user;
    title.style.color = "gray";
    title.style.marginBottom = "10px";

    chat.appendChild(title);

    let key = getChatKey(username, user);

    if (!chats[key]) return;

    chats[key].forEach(msg => {
        addMessage(msg);
    });
}

// 💬 отправка
function send() {
    let text = document.getElementById("msg").value;

    if (!currentChat) {
        alert("Выбери пользователя слева 👈");
        return;
    }

    if (!text.trim()) return;

    ws.send(JSON.stringify({
        type: "message",
        to: currentChat,
        text: text
    }))

document.getElementById("msg").value = "";
}

// 🧾 отображение
function addMessage(data) {
    let div = document.createElement("div");
    div.classList.add("msg");

    if (data.from === username) {
        div.classList.add("right");
        div.innerText = data.text;
    } else {
        div.classList.add("left");
        div.innerText = data.from + ": " + data.text;
    }

    document.getElementById("chat").appendChild(div);
    document.getElementById("chat").scrollTop = 999999;
}

// 🚀 старт
connect();