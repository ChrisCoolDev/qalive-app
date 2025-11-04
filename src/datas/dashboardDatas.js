export function exposeDashboardaInformations(totalSessions, totalQuestions, activeSessions) {
  return [
    {
      name: 'Total events',
      label: "All the sessions you've launched so far.",
      statistic: totalSessions,
      imagePath: '/illustrations/totalevents.svg',
    },
    {
      name: 'Total questions attempted',
      label: "Your audience's total engagement.",
      statistic: totalQuestions,
      imagePath: '/illustrations/totalquestions.svg',
    },
    {
      name: 'Active events',
      label: 'Sessions that are currently open for questions.',
      statistic: activeSessions,
      imagePath: '/illustrations/activeevents.svg',
    },
  ]
}
