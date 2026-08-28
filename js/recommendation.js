const Recommendation = (() => {
  function urgencyLabel(days) {
    if (days <= 2) return 'HIGH';
    if (days <= 6) return 'MEDIUM';
    return 'LOW';
  }

  function score(subject, topic) {
    const urgency = 1 / (Math.max(0, subject.daysLeft) + 1);
    const difficultyBoost = topic.difficulty ? topic.difficulty / 5 : 0.3;
    return urgency * 3 + topic.weight * 0.6 + difficultyBoost;
  }

  /** The single best next topic across all subjects, with a plain-language reason. */
  function bestNext() {
    const subjects = Subjects.load();
    let best = null;
    subjects.forEach(s => {
      const dl = Subjects.daysLeft(s.examDate);
      s.topics.filter(t => !t.done).forEach(t => {
        const sc = score({ daysLeft: dl }, t);
        if (!best || sc > best.score) best = { score: sc, subject: s, subjectDaysLeft: dl, topic: t };
      });
    });
    if (!best) return null;
    const minutes = 15 + best.topic.weight * 10;
    const reasons = [];
    if (best.subjectDaysLeft <= 3) reasons.push(`your ${best.subject.name} exam is in ${best.subjectDaysLeft <= 0 ? 'today or already passed' : best.subjectDaysLeft + ' day' + (best.subjectDaysLeft === 1 ? '' : 's')}`);
    if (best.topic.weight >= 4) reasons.push('it\'s a high-priority topic');
    if (best.topic.difficulty >= 4) reasons.push('you rated it difficult');
    if (reasons.length === 0) reasons.push('it\'s next in your plan');
    return {
      subjectId: best.subject.id,
      subjectName: best.subject.name,
      topicId: best.topic.id,
      topicText: best.topic.text,
      minutes,
      reason: `Because ${reasons.join(' and ')}, Orbit recommends a ${minutes}-minute session on this now.`,
    };
  }

  function examRadar() {
    return Subjects.summaries()
      .filter(s => s.daysLeft >= 0 && s.examDate)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .map(s => ({ ...s, urgency: urgencyLabel(s.daysLeft) }));
  }

  function crunchSubjects() {
    return Subjects.load().filter(s => Subjects.daysLeft(s.examDate) <= 1 && Subjects.daysLeft(s.examDate) >= 0 && s.topics.some(t => !t.done));
  }

  function crunchPlan(subject) {
    const undone = subject.topics.filter(t => !t.done);
    return {
      subjectName: subject.name,
      mustKnow: undone.filter(t => t.weight >= 4),
      shouldKnow: undone.filter(t => t.weight === 3),
      ifTime: undone.filter(t => t.weight < 3),
    };
  }

  function briefing() {
    const radar = examRadar();
    const rec = bestNext();
    const minutesInput = document.getElementById('planner-minutes-per-day');
    const availableMin = Math.max(30, parseInt(minutesInput ? minutesInput.value : 180, 10) || 180);
    return {
      pressure: radar.slice(0, 3),
      priority: rec,
      availableMinutes: availableMin,
    };
  }

  function insights() {
    const subjects = Subjects.load();
    const out = [];
    subjects.forEach(s => {
      const thisWeek = Store.subjectMinutesInRange(s.id, 7);
      const lastWeek = Store.subjectMinutesInRange(s.id, 14) - thisWeek;
      if (lastWeek > 0 && thisWeek > 0) {
        const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
        if (Math.abs(change) >= 10) {
          out.push(`Your ${s.name} study time ${change > 0 ? 'increased' : 'decreased'} ${Math.abs(change)}% this week.`);
        }
      }
    });
    const withTopics = subjects.filter(s => s.topics.length > 0);
    if (withTopics.length > 0) {
      const scored = withTopics.map(s => ({ s, pct: Math.round((s.topics.filter(t => t.done).length / s.topics.length) * 100) }));
      const strongest = scored.reduce((a, b) => (b.pct > a.pct ? b : a));
      const weakest = scored.reduce((a, b) => (b.pct < a.pct ? b : a));
      if (strongest.pct > 0) out.push(`${strongest.s.name} is currently your strongest subject at ${strongest.pct}% complete.`);
      if (weakest.pct < 50 && weakest.s.id !== strongest.s.id) out.push(`${weakest.s.name} needs attention — only ${weakest.pct}% complete.`);
    }
    if (out.length === 0) out.push('Study a little more to unlock personalised insights here.');
    return out;
  }

  return { bestNext, examRadar, crunchSubjects, crunchPlan, briefing, insights, urgencyLabel };
})();
