export function exposeDashboardaInformations(totalSessions, totalQuestions, activeSessions) {
  return [
    {
      name: 'Total events',
      label: 'All launched sessions.',
      statistic: totalSessions,
      icon: `<svg class="group" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 3H2" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M21 3V14.882C21 16.052 19.993 17 18.75 17H5.25C4.007 17 3 16.052 3 14.882V3" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M13 17L15 21" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M11 17L9 21" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M16 8L12.667 11.333L10.667 9.333L8 12" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>`,
      imagePath: '/illustrations/totalevents.svg',
    },
    {
      name: 'Attempted questions ',
      label: "Audience's engagement.",
      statistic: totalQuestions,
      icon: `<svg class="group" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M20.625 5.149C20.625 4.169 19.831 3.375 18.851 3.375H5.149C4.169 3.375 3.375 4.169 3.375 5.149V18.851C3.375 19.831 4.169 20.625 5.149 20.625H18.851C19.831 20.625 20.625 19.831 20.625 18.851V5.149V5.149Z" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M16.89 12H11.63" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7.67678 11.8232C7.77441 11.9208 7.77441 12.0791 7.67678 12.1768C7.57915 12.2744 7.42085 12.2744 7.32322 12.1768C7.22559 12.0791 7.22559 11.9208 7.32322 11.8232C7.42085 11.7256 7.57915 11.7256 7.67678 11.8232" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M16.89 7.5H11.63" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7.67678 7.32622C7.77441 7.42385 7.77441 7.58214 7.67678 7.67977C7.57915 7.77741 7.42085 7.77741 7.32322 7.67977C7.22559 7.58214 7.22559 7.42385 7.32322 7.32622C7.42085 7.22859 7.57915 7.22859 7.67678 7.32622" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M16.98 16.5H11.72" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7.76478 16.3272C7.86241 16.4248 7.86241 16.5831 7.76478 16.6808C7.66715 16.7784 7.50886 16.7784 7.41123 16.6808C7.3136 16.5831 7.3136 16.4248 7.41123 16.3272C7.50886 16.2296 7.66715 16.2296 7.76478 16.3272" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>`,
      imagePath: '/illustrations/totalquestions.svg',
    },
    {
      name: 'Active events',
      label: 'Current open sessions.',
      statistic: activeSessions,
      icon: `<svg class="group" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5447 19.615L11.3707 15.282C11.7027 14.906 12.2887 14.906 12.6207 15.282L16.4467 19.615C16.9207 20.153 16.5377 21 15.8207 21H8.1687C7.4517 21 7.0687 20.153 7.5447 19.615Z" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M18.879 17.797C20.201 16.231 21 14.21 21 12C21 7.029 16.971 3 12 3C7.029 3 3 7.029 3 12C3 14.207 3.797 16.226 5.116 17.792" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16.859 15.51C17.574 14.522 18 13.312 18 12C18 8.686 15.314 6 12 6C8.686 6 6 8.686 6 12C6 13.309 6.424 14.517 7.136 15.503" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14.771 13.145C14.917 12.792 15 12.406 15 12C15 10.343 13.657 9 12 9C10.343 9 9 10.343 9 12C9 12.403 9.082 12.785 9.226 13.136" stroke="#161924" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>`,
      imagePath: '/illustrations/activeevents.svg',
    },
  ]
}
