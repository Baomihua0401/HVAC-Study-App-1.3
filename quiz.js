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
  const progressText = document.getElementById("progress");
  const accuracyText = document.getElementById("accuracy");
  const languageSwitch = document.getElementById("language-switch");

  let currentLanguage = localStorage.getItem("language") || "cn";
  let currentQuestionIndex = parseInt(localStorage.getItem("currentQuestionIndex")) || 0;
  let questions = JSON.parse(localStorage.getItem("currentQuestions")) || [];
  let mistakes = JSON.parse(localStorage.getItem("mistakes")) || [];
  let correctAnswers = 0;
  let messages = [];

  if (questions.length === 0) {
    alert("⚠️ 没有加载到题库，请返回首页重新选择章节！");
    window.location.href = "index.html";
  }

  function loadQuestion() {
    const q = questions[currentQuestionIndex];
    if (!q) return;

    questionText.textContent = currentLanguage === "cn" ? q.question_cn : q.question_en;
    optionsContainer.innerHTML = "";
    chatHistoryBox.textContent = "";
    explanationText.textContent = "";
    followupInput.value = "";
    aiExplanationBox.classList.add("hidden");

    q.options.forEach((opt, index) => {
      const btn = document.createElement("button");
      btn.textContent = currentLanguage === "cn" ? opt.cn : opt.en;
      btn.classList.add("option-btn");
      btn.addEventListener("click", () => handleAnswer(index));
      optionsContainer.appendChild(btn);
    });

    progressText.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
    accuracyText.textContent = `${Math.round((correctAnswers / (currentQuestionIndex + 1)) * 100)}%`;

    messages = [
      { role: "system", content: "你是一个 HVAC 错题讲解 AI 助手。" },
      { role: "user", content: currentLanguage === "cn" ? q.question_cn : q.question_en }
    ];
  }

  function handleAnswer(index) {
    const q = questions[currentQuestionIndex];
    const correct = index === q.correct;

    const optionButtons = document.querySelectorAll(".option-btn");
    optionButtons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correct) btn.classList.add("correct");
      if (i === index && !correct) btn.classList.add("wrong");
    });

    if (correct) {
      correctAnswers++;
      mistakes = mistakes.filter(m => m.question_en !== q.question_en);
    } else {
      if (!mistakes.some(m => m.question_en === q.question_en)) {
        mistakes.push(q);
      }
    }

    localStorage.setItem("mistakes", JSON.stringify(mistakes));

    explanationText.textContent = currentLanguage === "cn" ? q.explanation_cn : q.explanation_en;
    aiExplanationBox.classList.remove("hidden");

    aiButton.onclick = async () => {
      aiButton.disabled = true;
      chatHistoryBox.textContent = "AI 正在思考中...";
      const aiReply = await fetchAIReply(messages.at(-1).content);
      messages.push({ role: "assistant", content: aiReply });
    };
  }

  async function fetchAIReply(questionText) {
    try {
      const res = await fetch("https://hvac-worker.d5p9gftz8.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText })
      });

      if (!res.ok) {
        chatHistoryBox.textContent = "❌ AI请求失败：" + res.status;
        return "";
      }

      const data = await res.json();
      const reply = data.answer || "AI 没有返回内容。";
      chatHistoryBox.textContent = reply;
      return reply;
    } catch (e) {
      chatHistoryBox.textContent = "❌ AI 解析失败，请稍后重试...";
      return "";
    }
  }

  followupBtn.onclick = async () => {
    const userText = followupInput.value.trim();
    if (!userText) return;

    messages.push({ role: "user", content: userText });
    followupInput.disabled = true;
    followupInput.value = "AI 正在思考...";
    const reply = await fetchAIReply(userText);
    messages.push({ role: "assistant", content: reply });
    followupInput.value = "";
    followupInput.disabled = false;
  };

  nextButton.onclick = () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      localStorage.setItem("currentQuestionIndex", currentQuestionIndex);
      loadQuestion();
    } else {
      alert("✅ 全部题目完成！");
      window.location.href = "index.html";
    }
  };

  backButton.onclick = () => {
    window.location.href = "index.html";
  };

  languageSwitch.onclick = () => {
    currentLanguage = currentLanguage === "cn" ? "en" : "cn";
    localStorage.setItem("language", currentLanguage);
    loadQuestion();
  };

  loadQuestion();
});
