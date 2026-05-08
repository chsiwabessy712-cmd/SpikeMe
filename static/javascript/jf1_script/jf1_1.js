const line = document.getElementById("numberLine");
const slider = document.getElementById("zoomSlider");

function createNumberLine(zoom) {

    line.innerHTML = "";

    let minNumber = -4;
    let maxNumber = 4;
    let spacing = 140 * zoom;

    let totalNumbers = maxNumber - minNumber + 1;
    line.style.width = spacing * totalNumbers + "px";

    for (let i = minNumber; i <= maxNumber; i++) {

        let pos = (i - minNumber) * spacing;

        // Whole number tick
        let tick = document.createElement("div");
        tick.className = "tick";
        tick.style.left = pos + "px";

        // Whole number label
        let label = document.createElement("div");
        label.className = "label";
        label.innerText = i;
        label.style.left = (pos - 6) + "px";

        line.appendChild(tick);
        line.appendChild(label);

        // Add decimal numbers when zoomed
        if (zoom >= 2) {
            for (let d = 1; d < 10; d++) {

                let decimalPos = pos + (spacing / 10) * d;

                // Avoid going beyond 5
                if (i < maxNumber) {

                    let dtick = document.createElement("div");
                    dtick.className = "decimal-tick";
                    dtick.style.left = decimalPos + "px";

                    line.appendChild(dtick);

                    if (zoom >= 3) {

                        let dlabel = document.createElement("div");
                        dlabel.className = "decimal-label";
                        dlabel.innerText = (i + d / 10).toFixed(1);
                        dlabel.style.left = (decimalPos - 12) + "px";

                        line.appendChild(dlabel);
                    }
                }
            }
        }
    }
}

slider.addEventListener("input", () => {
    createNumberLine(slider.value);
});

createNumberLine(1);

let currentAngle = 0;

/* ===== RESET WHEEL ===== */
function resetWheel() {
    currentAngle = 0;
    document.getElementById("wheel").style.transform = "rotate(0deg)";
    document.getElementById("info").innerText = "Motor reset to starting position";
}

/* ===== BUTTON ROTATION ===== */
function rotateWheel(step) {

    let rotationAmount = step * 360;
    currentAngle += rotationAmount;

    updateWheel(step);
}

/* ===== USER INPUT ROTATION ===== */
function rotateFromInput() {

    let value = document.getElementById("userInput").value;
    let number = parseFloat(value);

    if (isNaN(number)) {
        alert("Please enter a valid number");
        return;
    }

    let rotationAmount = number * 360;
    currentAngle += rotationAmount;

    updateWheel(number);
}

/* ===== APPLY ROTATION + INFO ===== */
function updateWheel(number) {

    document.getElementById("wheel").style.transform =
        "rotate(" + currentAngle + "deg)";

    if (number > 0) {
        document.getElementById("info").innerText =
            "Positive number → Clockwise rotation";
    }
    else if (number < 0) {
        document.getElementById("info").innerText =
            "Negative number → Anticlockwise rotation";
    }
    else {
        document.getElementById("info").innerText =
            "Zero → No rotation";
    }
}

// ===== QUIZ SYSTEM =====

let quizData = [
    {
        question: "If we rotate +1, which direction?",
        options: ["Clockwise", "Anticlockwise"],
        answer: "Clockwise"
    },
    {
        question: "If we rotate -1, which direction?",
        options: ["Clockwise", "Anticlockwise"],
        answer: "Anticlockwise"
    },
    {
        question: "Positive numbers rotate the wheel...",
        options: ["Clockwise", "Anticlockwise"],
        answer: "Clockwise"
    },
    {
        question: "Negative numbers rotate the wheel...",
        options: ["Clockwise", "Anticlockwise"],
        answer: "Anticlockwise"
    }
];

let currentQuestion = 0;
let score = 0;

function startQuiz() {
    currentQuestion = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {

    let q = quizData[currentQuestion];

    document.getElementById("question").innerText = q.question;

    let optionsHTML = "";

    q.options.forEach(option => {
        optionsHTML += `<div class="option" onclick="checkAnswer('${option}')">${option}</div>`;
    });

    document.getElementById("options").innerHTML = optionsHTML;
}

function checkAnswer(selected) {

    let correct = quizData[currentQuestion].answer;

    if (selected === correct) {
        score++;
        alert("Correct! 🎉");
    } else {
        alert("Oops! Try again next time 😊");
    }

    currentQuestion++;

    if (currentQuestion < quizData.length) {
        showQuestion();
    }
    else {
        document.getElementById("question").innerText = "Quiz Finished!";
        document.getElementById("options").innerHTML = "";
        document.getElementById("score").innerText =
            "Your Score: " + score + "/" + quizData.length;
    }
}