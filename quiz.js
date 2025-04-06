document.addEventListener("DOMContentLoaded", () => {
  const questionText = document.getElementById("question-text");
  const optionsContainer = document.getElementById("options");
  const explanationText = document.getElementById("explanation");
  const aiExplanationBox = document.getElementById("ai-explanation-box");
  const aiButton = document.getElementById("ai-btn");
  const followupInput = document.getElementById("followup-input");
  const followupBtn = document.getElementById("followup-btn");
  const chatHistoryBox = document.getElementById("chat-history");
  const nextButton = document.getElementById("next-btn");
  const backButton = document.getElementById("back-btn");

  const questions = JSON.parse(localStorage.getItem("currentQuestions")) || [];
  const mistakes = JSON.parse(localStorage.getItem("mistakes")) || [];
  let currentQuestionIndex = parseInt(localStorage.getItem("currentQuestionIndex")) || 0;
  let correctAnswers = 0;
  const currentQuestion = questions[currentQuestionIndex];

  let chatHistory = [
    { role: "system", content: "你是一个 HVAC 行业错题讲解助手，帮助用户理解错题背后的知识点。" },
    { role: "user", content: `请帮我讲解这道题：${currentQuestion.question_cn}` }
  ];

  function loadQuestion() {
    const question = questions[currentQuestionIndex];
    questionText.textContent = question.question_cn;
    optionsContainer.innerHTML = "";
    aiExplanationBox.classList.add("hidden");
    aiButton.disabled = false;
    chatHistoryBox.innerHTML = "";
    followupInput.value = "";

    question.options.forEach((opt, index) => {
      const btn = document.createElement("button");
      btn.textContent = opt.cn;
      btn.classList.add("option-btn");
      btn.addEventListener("click", () => {
        const correct = question.correct === index;
        if (correct) {
          correctAnswers++;
        } else {
          mistakes.push(question);
        }
        aiButton.classList.remove("hidden");
        aiButton.onclick = () => {
          fetchAIExplanation(chatHistory);
        };
      });
      optionsContainer.appendChild(btn);
    });
  }

  async function fetchAIExplanation(history) {
    aiExplanationBox.classList.remove("hidden");
    aiButton.disabled = true;
    explanationText.textContent = "AI 正在解析中...";
    const res = await fetch("https://hvac-worker.d5p9gttfz8.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    });
    const data = await res.json();
    const reply = data.answer || "AI 无法返回解释内容。";
    explanationText.textContent = reply;
    chatHistory.push({ role: "assistant", content: reply });
    appendChat("🤖", reply);
  }

  function appendChat(role, text) {
    const p = document.createElement("p");
    p.textContent = `${role}: ${text}`;
    chatHistoryBox.appendChild(p);
  }

  followupBtn.addEventListener("click", async () => {
    const followup = followupInput.value.trim();
    if (!followup) return;
    chatHistory.push({ role: "user", content: followup });
    appendChat("你", followup);
    followupInput.value = "";
    await fetchAIExplanation(chatHistory);
  });

  nextButton.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      localStorage.setItem("currentQuestionIndex", currentQuestionIndex);
      loadQuestion();
    } else {
      localStorage.setItem("mistakes", JSON.stringify(mistakes));
      alert("🎉 答题结束！");
      window.location.href = "index.html";
    }
  });

  backButton.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  loadQuestion();
});
