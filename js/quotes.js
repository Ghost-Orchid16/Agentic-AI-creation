const Quotes = (() => {
  const QUOTES = [
    "Small daily study beats last-minute cramming — you're already doing it right.",
    "You don't have to be perfect today, you just have to start.",
    "Every topic you check off is a topic you no longer have to fear.",
    "Discipline is choosing between what you want now and what you want most.",
    "The exam ends in hours. What you learn today can last years.",
    "Focus on progress, not perfection.",
    "Your future self is watching you study right now — make them proud.",
    "Hard topics today become easy topics tomorrow, with practice.",
    "One page at a time is still forward.",
    "Rest is part of studying too — don't skip it.",
    "You've prepared for moments like this. Trust your prep.",
    "Consistency beats intensity. Show up today.",
    "The version of you that finishes this chapter is closer than you think.",
    "Don't count the days, make the days count.",
    "A calm mind absorbs more than a rushed one — breathe, then begin.",
  ];

  function init() {
    const el = document.getElementById('quote-banner');
    if (!el) return;
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    el.textContent = `“${q}”`;
  }

  return { init };
})();
