// Patterns for detecting sensitive data
export const sensitiveDataPatterns = [
  {
    name: 'Email address',
    type: 'regex',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b'
  },
  {
    name: 'Credit card number',
    type: 'regex',
    pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})\\b'
  },
  {
    name: 'Social Security Number',
    type: 'regex',
    pattern: '\\b(?!000|666|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b'
  },
  {
    name: 'API key',
    type: 'regex',
    pattern: '\\b(?:api[_-]?key|apikey|access[_-]?key|auth[_-]?token)[\\s:=]+[\'"`]?([\\w]{16,})[\'"`]?'
  },
  {
    name: 'Password',
    type: 'regex',
    pattern: '\\b(?:password|passwd|pwd)[\\s:=]+[\'"`]?([\\w@#$%^&*()-+]{8,})[\'"`]?'
  },
  {
    name: 'Phone number',
    type: 'regex',
    pattern: '\\b(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b'
  },
  {
    name: 'IP address',
    type: 'regex',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b'
  }
];