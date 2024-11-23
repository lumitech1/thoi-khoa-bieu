const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// API setup
const API_KEY = "AIzaSyAgmyP-xmFxDj87kk0kYoD4xhKSLcMSQhE";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

// Initialize user message and file data
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

// Store chat history
const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  // Add user message to chat history
  chatHistory.push({
    role: "user",
    parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])],
  });

  // API request options
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: chatHistory,
    }),
  };

  try {
    // Fetch bot response from API
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Extract and display bot's response text
    const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    messageElement.innerText = apiResponseText;

    // Add bot response to chat history
    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponseText }],
    });
  } catch (error) {
    // Handle error in API response
    console.log(error);
    messageElement.innerText = error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    // Reset user's file data, removing thinking indicator and scroll chat to bottom
    userData.file = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// Handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  fileUploadWrapper.classList.remove("file-uploaded");

  // Create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;

  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  outgoingMessageDiv.querySelector(".message-text").innerText = userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
            <path
              d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"/></svg>
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;

    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && !e.shiftKey && userMessage && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileInput.value = "";
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];

    // Store file data in userData
    userData.file = {
      data: base64String,
      mime_type: file.type,
    };
  };

  reader.readAsDataURL(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});

document.querySelector(".chat-form").appendChild(picker);

sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));

let itemBeingEdited = null;

function initPage() {
    displayCurrentDateTime();
    setupScrollToTopButton();
    setupSnowflakes();
    loadScheduleFromLocalStorage();
    updateTodaySchedule()
}

function displayCurrentDateTime() {
    const dateTimeElement = document.getElementById("date-time");
    setInterval((() => {
        const now = new Date;
        const timeString = now.toLocaleTimeString("vi-VN");
        const dateString = now.toLocaleDateString("vi-VN");
        dateTimeElement.innerHTML = `<i class="fas fa-clock"></i> ${timeString} | <i class="fas fa-calendar-alt"></i> ${dateString}`
    }), 1e3)
}

function setupScrollToTopButton() {
    const scrollToTopButton = document.getElementById("scroll-to-top");
    window.addEventListener("scroll", (() => {
        scrollToTopButton.style.display = window.scrollY > 200 ? "block" : "none"
    }))
}

function scrollToTop(duration) {
    const startPosition = window.pageYOffset;
    const startTime = performance.now();

    function animationScroll(currentTime) {
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, -startPosition, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) {
            requestAnimationFrame(animationScroll)
        }
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b
    }
    requestAnimationFrame(animationScroll)
}
document.getElementById("scroll-to-top").addEventListener("click", (function() {
    scrollToTop(1500)
}));
let itemToDelete = null;

function confirmDelete() {
    if (itemToDelete) {
        itemToDelete.style.transition = "opacity 0.5s";
        itemToDelete.style.opacity = "0";
        setTimeout((() => {
            itemToDelete.remove();
            saveScheduleToLocalStorage();
            showNotification("Xóa thành công!", "success");
            itemToDelete = null;
            closeModal()
        }), 500)
    }
}

function openDeleteModal(item) {
    itemToDelete = item;
    document.getElementById("confirm-modal").classList.add("show")
}

function closeModal() {
    document.getElementById("confirm-modal").classList.remove("show")
}

function cancelDelete() {
    itemToDelete = null;
    closeModal()
}

function validateForm() {
    const subject = document.getElementById("subject").value.trim();
    const teacher = document.getElementById("teacher").value.trim();
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    if (!subject || !teacher) {
        showNotification("Hãy điền đầy đủ thông tin cho bộ môn và giáo viên.", "error");
        return false
    }
    if (startTime >= endTime) {
        showNotification("Giờ bắt đầu phải trước giờ kết thúc.", "error");
        return false
    }
    return true
}

function validateAndUpdateSchedule() {
    if (!validateForm()) return;
    const subject = document.getElementById("subject").value;
    const teacher = document.getElementById("teacher").value;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const daysChecked = days.map((day => document.getElementById(day).checked ? "✔" : ""));
    let scheduleRow;
    if (itemBeingEdited) {
        scheduleRow = itemBeingEdited;
        scheduleRow.style.transition = "background-color 0.5s";
        scheduleRow.style.backgroundColor = "#d1ffd1"
    } else {
        scheduleRow = document.createElement("tr");
        scheduleRow.style.opacity = "0";
        scheduleRow.innerHTML = `\n            <td>${subject}</td>\n            <td>${teacher}</td>\n            <td>${startTime} - ${endTime}</td>\n            ${daysChecked.map((day=>`<td>${day}</td>`)).join("")}\n            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>\n            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>\n        `;
        document.getElementById("schedule-body").appendChild(scheduleRow);
        setTimeout((() => {
            scheduleRow.style.transition = "opacity 0.5s";
            scheduleRow.style.opacity = "1"
        }), 0)
    }
    saveScheduleToLocalStorage();
    clearForm();
    showNotification("Cập nhật thành công!", "success");
    itemBeingEdited = null
}

function clearForm() {
    document.getElementById("subject").value = "";
    document.getElementById("teacher").value = "";
    document.getElementById("start-time").value = "";
    document.getElementById("end-time").value = "";
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach((day => {
        document.getElementById(day).checked = false
    }));
    itemBeingEdited = null
}

function saveScheduleToLocalStorage() {
    const scheduleData = Array.from(document.querySelectorAll("#schedule-body tr")).map((row => {
        const cells = row.children;
        return {
            subject: cells[0].textContent,
            teacher: cells[1].textContent,
            time: cells[2].textContent,
            days: Array.from(cells).slice(3, 10).map((cell => cell.textContent === "✔"))
        }
    }));
    localStorage.setItem("scheduleData", JSON.stringify(scheduleData))
}

function getTodaySchedule() {
    const scheduleData = JSON.parse(localStorage.getItem("scheduleData")) || [];
    const today = (new Date).getDay();
    const todaySchedule = scheduleData.filter((data => data.days[today - 1] === true));
    if (todaySchedule.length === 0) {
        return "Không có lịch học nào hôm nay."
    }
    return todaySchedule.map((data => `* ${data.subject} (${data.time}) - Giáo viên: ${data.teacher}`)).join("<br/>")
}

function updateTodaySchedule() {
    const scheduleDetails = document.getElementById("schedule-details");
    const todaySchedule = getTodaySchedule();
    if (todaySchedule === "Không có lịch học nào hôm nay.") {
        scheduleDetails.innerHTML = todaySchedule
    } else {
        scheduleDetails.innerHTML = todaySchedule;
        scheduleDetails.style.display = "block"
    }
}

function loadScheduleFromLocalStorage() {
    const scheduleData = JSON.parse(localStorage.getItem("scheduleData")) || [];
    const scheduleBody = document.getElementById("schedule-body");
    scheduleBody.innerHTML = "";
    scheduleData.forEach((data => {
        const scheduleRow = document.createElement("tr");
        scheduleRow.innerHTML = `\n            <td>${data.subject}</td>\n            <td>${data.teacher}</td>\n            <td>${data.time}</td>\n            ${data.days.map((day=>`<td>${day?"✔":""}</td>`)).join("")}\n            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>\n            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>\n        `;
        scheduleBody.appendChild(scheduleRow)
    }));
    updateTodaySchedule()
}

function editSchedule(row) {
    const cells = row.children;
    document.getElementById("subject").value = cells[0].textContent;
    document.getElementById("teacher").value = cells[1].textContent;
    const time = cells[2].textContent.split(" - ");
    document.getElementById("start-time").value = time[0];
    document.getElementById("end-time").value = time[1];
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    days.forEach(((day, index) => {
        document.getElementById(day).checked = cells[index + 3].textContent === "✔"
    }));
    itemBeingEdited = row
}

function searchTable(type) {
    const searchTerm = document.getElementById(`search-${type}`).value.toLowerCase();
    const rows = document.querySelectorAll("#schedule-table tbody tr");
    rows.forEach((row => {
        const cell = row.querySelector(`td:nth-child(${type==="subject"?1:2})`).textContent.toLowerCase();
        row.style.display = cell.includes(searchTerm) ? "" : "none"
    }))
}

function searchAndFilterSchedule() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    const rows = document.querySelectorAll("#schedule-body tr");
    rows.forEach((row => {
        const subject = row.querySelector("td:nth-child(1)").textContent.toLowerCase();
        const teacher = row.querySelector("td:nth-child(2)").textContent.toLowerCase();
        row.style.display = subject.includes(searchTerm) || teacher.includes(searchTerm) ? "" : "none"
    }))
}
document.getElementById("search-input").addEventListener("input", searchAndFilterSchedule);

function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `popup show ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout((() => {
        notification.classList.remove("show");
        document.body.removeChild(notification)
    }), 3e3)
}

function setupSnowflakes() {
    const snowflakes = document.querySelectorAll(".snowflake");
    snowflakes.forEach((snowflake => {
        snowflake.addEventListener("click", (() => snowflake.classList.toggle("paused")))
    }))
}

function loadScheduleFromLocalStorage() {
    const scheduleData = JSON.parse(localStorage.getItem("scheduleData")) || [];
    scheduleData.forEach((data => {
        const scheduleRow = document.createElement("tr");
        scheduleRow.classList.add("visible");
        scheduleRow.innerHTML = `\n            <td>${data.subject}</td>\n            <td>${data.teacher}</td>\n            <td>${data.time}</td>\n            ${data.days.map((day=>`<td>${day?"✔":""}</td>`)).join("")}\n            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>\n            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>\n        `;
        document.getElementById("schedule-body").appendChild(scheduleRow)
    }));
    setTimeout((() => {
        document.querySelectorAll("#schedule-body tr").forEach((row => row.classList.add("visible")))
    }), 0)
}

function validateAndUpdateSchedule() {
    if (!validateForm()) return;
    const subject = document.getElementById("subject").value;
    const teacher = document.getElementById("teacher").value;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const daysChecked = days.map((day => document.getElementById(day).checked ? "✔" : ""));
    let scheduleRow;
    if (itemBeingEdited) {
        scheduleRow = itemBeingEdited;
        scheduleRow.style.transition = "background-color 0.5s";
        scheduleRow.classList.add("updated");
        scheduleRow.innerHTML = `\n            <td>${subject}</td>\n            <td>${teacher}</td>\n            <td>${startTime} - ${endTime}</td>\n            ${daysChecked.map((day=>`<td>${day}</td>`)).join("")}\n            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>\n            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>\n        `
    } else {
        scheduleRow = document.createElement("tr");
        scheduleRow.innerHTML = `\n            <td>${subject}</td>\n            <td>${teacher}</td>\n            <td>${startTime} - ${endTime}</td>\n            ${daysChecked.map((day=>`<td>${day}</td>`)).join("")}\n            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>\n            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>\n        `;
        document.getElementById("schedule-body").appendChild(scheduleRow)
    }
    saveScheduleToLocalStorage();
    clearForm();
    showNotification("Cập nhật thành công!", "success");
    itemBeingEdited = null
}

function exportToCSV() {
    const rows = document.querySelectorAll("#schedule-table tr");
    let csvContent = "\ufeff";
    rows.forEach((row => {
        let rowData = Array.from(row.querySelectorAll("td, th")).map((cell => cell.textContent)).join(",");
        csvContent += rowData + "\r\n"
    }));
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "thoi_khoa_bieu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Xuất CSV thành công!", "success")
}

function showInfoPopup() {
    const popup = document.getElementById("info-popup");
    popup.style.display = "block";
    setTimeout((() => {
        popup.classList.add("show");
        popup.classList.remove("hide")
    }), 10);
    updatePopupContent();
    setTimeout((() => {
        closeInfoPopup()
    }), 1e4)
}

function closeInfoPopup() {
    const popup = document.getElementById("info-popup");
    popup.classList.add("hide");
    popup.classList.remove("show");
    setTimeout((() => {
        popup.style.display = "none"
    }), 500)
}

function updatePopupContent() {
    const today = new Date;
    const dayOfWeek = today.toLocaleString("vi-VN", {
        weekday: "long"
    });
    const dateStr = today.toLocaleDateString("vi-VN");
    const holidays = {
        "01/01": "Tết Dương Lịch",
        "30/04": "Ngày Giải Phóng",
        "01/05": "Quốc tế Lao Động",
        "02/09": "Quốc khánh"
    };
    const holidayInfo = holidays[dateStr.slice(0, 5)] || "Không có ngày lễ đặc biệt";
    document.getElementById("current-day").textContent = `Hôm nay là: ${dayOfWeek}, ${dateStr}`;
    document.getElementById("holiday-info").textContent = `Ngày lễ: ${holidayInfo}`;
    document.getElementById("today-schedule-info").textContent = `Lịch học hôm nay: ${getTodaySchedule()}`;
    const gifElement = document.getElementById("today-schedule-gif");
    const todaySchedule = getTodaySchedule();
    if (todaySchedule.includes("Không có lịch học nào")) {
        gifElement.src = "assets/images/play.gif"
    } else {
        gifElement.src = "assets/images/study.gif"
    }
    gifElement.style.display = "block"
}

function requestNotificationPermission() {
    if ("Notification" in window) {
        if (Notification.permission === "default" || Notification.permission === "denied") {
            const interval = setInterval((() => {
                Notification.requestPermission().then((permission => {
                    if (permission === "granted") {
                        clearInterval(interval);
                        console.log("Đã cấp quyền thông báo.")
                    } else {
                        console.log("Người dùng từ chối quyền thông báo.")
                    }
                }))
            }), 1e3)
        }
    } else {
        console.log("Trình duyệt không hỗ trợ Notification API.")
    }
}

function checkDeviceOrientation() {
    const orientationWarning = document.getElementById("orientation-warning");
    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        if (window.innerHeight > window.innerWidth) {
            orientationWarning.style.display = "block"
        } else {
            orientationWarning.style.display = "none"
        }
    } else {
        orientationWarning.style.display = "none"
    }
}
window.addEventListener("load", checkDeviceOrientation);
window.addEventListener("resize", checkDeviceOrientation);
const API_KEYY = "db0515323dc243a4a56114131241010";
async function fetchWeather() {
    const weatherElement = document.getElementById("weather");
    try {
        navigator.geolocation.getCurrentPosition((async position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${API_KEYY}&q=${latitude},${longitude}&lang=vi`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Không thể lấy dữ liệu thời tiết");
            const data = await response.json();
            const temperature = data.current.temp_c;
            const description = data.current.condition.text;
            const iconUrl = data.current.condition.icon;
            weatherElement.innerHTML = `<img src="${iconUrl}" alt="Weather Icon">${temperature}°C, ${description}`;
            const weatherText = `Nhiệt độ hiện tại là ${temperature} độ C, và trời đang ${description}`;
            speak(weatherText);
            addChatMessage("bot", weatherText)
        }), (() => {
            weatherElement.textContent = "Không thể lấy vị trí. Vui lòng cấp quyền truy cập."
        }))
    } catch (error) {
        weatherElement.textContent = "Không thể lấy dữ liệu thời tiết.";
        console.error(error)
    }
}

function addNewItem(item) {
    item.classList.add("fade-in");
    document.getElementById("schedule-body").appendChild(item)
}

function requestNotificationPermission() {
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            showNotification("Thông báo đẩy đã được kích hoạt!", "Chúc bạn học tốt!")
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission => {
                if (permission === "granted") {
                    showNotification("Thông báo đẩy đã được kích hoạt!", "Chúc bạn học tốt!")
                }
            }))
        }
    }
}

function showNotification(title, body) {
    new Notification(title, {
        body: body,
        icon: "assets/images/notification-icon.png"
    })
}

function initDarkMode() {
    const isDarkMode = localStorage.getItem("darkMode") === "enabled";
    if (isDarkMode) {
        document.body.classList.add("dark-mode");
        document.getElementById("dark-mode-toggle").checked = true;
        document.getElementById("dark-mode-label").textContent = "Chế độ tối";
        document.getElementById("mode-icon").classList.replace("fa-sun", "fa-moon")
    }
}

function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    document.getElementById("dark-mode-label").textContent = isDarkMode ? "Chế độ tối" : "Chế độ sáng";
    document.getElementById("mode-icon").classList.toggle("fa-sun", !isDarkMode);
    document.getElementById("mode-icon").classList.toggle("fa-moon", isDarkMode);
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled")
}

function applyAdvancedFilter() {
    const dayFilter = document.getElementById("filter-day").value.toLowerCase();
    const typeFilter = document.getElementById("filter-type").value.toLowerCase();
    const teacherFilter = document.getElementById("filter-teacher").value.toLowerCase();
    const startTime = document.getElementById("filter-time-start").value;
    const endTime = document.getElementById("filter-time-end").value;
    const rows = document.querySelectorAll("#schedule-body tr");
    rows.forEach((row => {
        const cells = row.children;
        const day = cells[4].textContent.toLowerCase();
        const type = cells[0].textContent.toLowerCase();
        const teacher = cells[1].textContent.toLowerCase();
        const time = cells[2].textContent.split(" - ");
        const rowStartTime = time[0];
        const rowEndTime = time[1];
        let match = true;
        if (dayFilter && !day.includes(dayFilter)) {
            match = false
        }
        if (typeFilter && !type.includes(typeFilter)) {
            match = false
        }
        if (teacherFilter && !teacher.includes(teacherFilter)) {
            match = false
        }
        if (startTime && rowStartTime < startTime) {
            match = false
        }
        if (endTime && rowEndTime > endTime) {
            match = false
        }
        row.style.display = match ? "" : "none"
    }))
}

function applyAdvancedFilter() {
    const dayFilter = document.getElementById("filter-day").value.toLowerCase();
    const typeFilter = document.getElementById("filter-type").value.toLowerCase();
    const teacherFilter = document.getElementById("filter-teacher").value.toLowerCase();
    const startTime = document.getElementById("filter-time-start").value;
    const endTime = document.getElementById("filter-time-end").value;
    const rows = document.querySelectorAll("#schedule-body tr");
    rows.forEach((row => {
        const cells = row.children;
        const day = cells[4].textContent.toLowerCase();
        const type = cells[0].textContent.toLowerCase();
        const teacher = cells[1].textContent.toLowerCase();
        const time = cells[2].textContent.split(" - ");
        const rowStartTime = time[0];
        const rowEndTime = time[1];
        let match = true;
        if (dayFilter && !day.includes(dayFilter)) {
            match = false
        }
        if (typeFilter && !type.includes(typeFilter)) {
            match = false
        }
        if (teacherFilter && !teacher.includes(teacherFilter)) {
            match = false
        }
        if (startTime && rowStartTime < startTime) {
            match = false
        }
        if (endTime && rowEndTime > endTime) {
            match = false
        }
        row.style.display = match ? "" : "none"
    }))
}
const keywords = ["lý thuyết", "thực hành", "giáo viên A", "giáo viên B", "thứ 2", "thứ 3"];

function showSuggestions() {
    const input = document.getElementById("search-input").value.toLowerCase();
    const suggestionBox = document.getElementById("suggestions");
    suggestionBox.innerHTML = "";
    suggestionBox.style.display = "none";
    if (input.length === 0) {
        return
    }
    const filteredSuggestions = keywords.filter((keyword => keyword.toLowerCase().includes(input)));
    if (filteredSuggestions.length > 0) {
        suggestionBox.style.display = "block";
        filteredSuggestions.forEach((suggestion => {
            const div = document.createElement("div");
            div.classList.add("suggestion-item");
            div.textContent = suggestion;
            div.onclick = () => {
                document.getElementById("search-input").value = suggestion;
                suggestionBox.style.display = "none"
            };
            suggestionBox.appendChild(div)
        }))
    }
}

function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "vi-VN";
    window.speechSynthesis.speak(speech)
}

function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    const decodedJwt = parseJwt(response.credential);
    console.log("Decoded JWT ID token:", decodedJwt);
    fetch("/your-backend-verification-endpoint", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id_token: response.credential
        })
    }).then((response => response.json())).then((data => {
        console.log("Success:", data)
    })).catch((error => {
        console.error("Error:", error)
    }))
}
if ("serviceWorker" in navigator) {
    window.addEventListener("load", (() => {
        navigator.serviceWorker.register("/service-worker.js").then((registration => {
            console.log("Service Worker đã được đăng ký với scope:", registration.scope)
        })).catch((error => {
            console.log("Đăng ký Service Worker thất bại:", error)
        }))
    }))
}
let hangDoiDongBo = [];

function dongBoDuLieu() {
    if (navigator.onLine) {
        hangDoiDongBo.forEach((item => {
            fetch("/api/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(item)
            }).then((response => {
                if (response.ok) {
                    console.log("Đồng bộ dữ liệu thành công:", item)
                }
            })).catch((error => console.error("Lỗi đồng bộ:", error)))
        }));
        hangDoiDongBo = []
    }
}
window.addEventListener("online", dongBoDuLieu);

function capNhatThoiKhoaBieuOffline(duLieu) {
    if (navigator.onLine) {
        fetch("/api/sync", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(duLieu)
        })
    } else {
        hangDoiDongBo.push(duLieu);
        console.log("Đã lưu vào hàng đợi để đồng bộ sau:", duLieu)
    }
}

function filterScheduleData() {
    const filterType = document.getElementById("export-filter-type").value;
    const filterValue = document.getElementById("export-filter-value").value.toLowerCase();
    const scheduleData = JSON.parse(localStorage.getItem("scheduleData")) || [];
    return scheduleData.filter((item => {
        if (filterType === "day") {
            return item.days.includes(filterValue)
        } else if (filterType === "subject") {
            return item.subject.toLowerCase().includes(filterValue)
        } else if (filterType === "teacher") {
            return item.teacher.toLowerCase().includes(filterValue)
        }
        return true
    }))
}

function exportToExcel(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ThoiKhoaBieu");
    XLSX.writeFile(workbook, "thoi_khoa_bieu.xlsx")
}

function exportToJson(data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], {
        type: "application/json"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "thoi_khoa_bieu.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link)
}

function exportToXml(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<schedule>\n';
    data.forEach((item => {
        xml += "  <subject>\n";
        xml += `    <name>${item.subject}</name>\n`;
        xml += `    <teacher>${item.teacher}</teacher>\n`;
        xml += `    <time>${item.time}</time>\n`;
        xml += "    <days>\n";
        item.days.forEach(((day, index) => {
            if (day) {
                xml += `      <day>${["monday","tuesday","wednesday","thursday","friday","saturday","sunday"][index]}</day>\n`
            }
        }));
        xml += "    </days>\n";
        xml += "  </subject>\n"
    }));
    xml += "</schedule>";
    const blob = new Blob([xml], {
        type: "application/xml"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "thoi_khoa_bieu.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link)
}

function exportData(format) {
    const filteredData = filterScheduleData();
    if (format === "excel") {
        exportToExcel(filteredData)
    } else if (format === "json") {
        exportToJson(filteredData)
    } else if (format === "xml") {
        exportToXml(filteredData)
    } else {
        console.error("Định dạng không hỗ trợ:", format)
    }
}
window.onload = function() {
    initPage();
    initDarkMode();
    showInfoPopup();
    displayCurrentDateTime();
    setupScrollToTopButton();
    setupSnowflakes();
    updateTodaySchedule();
    fetchWeather();
    checkDeviceOrientation();
    requestNotificationPermission()
};